package com.outdoor.compass;

import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import android.graphics.*;
import android.hardware.*;
import android.view.*;
import android.widget.*;
import java.util.Locale;

public class MainActivity extends Activity implements SensorEventListener {
    private SensorManager sm; private Sensor rotation; private CompassView compass;
    private TextView degrees, direction, status;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(20,35,29));
        getWindow().setNavigationBarColor(Color.rgb(20,35,29));
        sm=(SensorManager)getSystemService(Context.SENSOR_SERVICE);
        rotation=sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        LinearLayout root=new LinearLayout(this); root.setOrientation(1); root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(dp(14),dp(10),dp(14),dp(12)); root.setBackgroundColor(Color.rgb(20,35,29));
        TextView title=new TextView(this); title.setText("FIELD COMPASS"); title.setTextColor(0xffe4ead9); title.setTextSize(13); title.setLetterSpacing(.24f); title.setGravity(Gravity.CENTER);
        root.addView(title,new LinearLayout.LayoutParams(-1,dp(30)));
        TextView subtitle=new TextView(this); subtitle.setText("专业地图指北针  /  BASEPLATE ORIENTING COMPASS"); subtitle.setTextColor(0xff91a995); subtitle.setTextSize(9); subtitle.setGravity(Gravity.CENTER);
        root.addView(subtitle,new LinearLayout.LayoutParams(-1,dp(24)));
        compass=new CompassView(this); LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,0,1); cp.topMargin=dp(5); cp.bottomMargin=dp(5); root.addView(compass,cp);
        degrees=new TextView(this); degrees.setText("000°"); degrees.setTextColor(0xfff0ecd7); degrees.setTextSize(43); degrees.setGravity(Gravity.CENTER); degrees.setTypeface(Typeface.create("sans-serif-condensed",Typeface.BOLD)); root.addView(degrees,new LinearLayout.LayoutParams(-1,dp(55)));
        direction=new TextView(this); direction.setText("北 N"); direction.setTextColor(0xffdfb866); direction.setTextSize(16); direction.setGravity(Gravity.CENTER); root.addView(direction,new LinearLayout.LayoutParams(-1,dp(27)));
        status=new TextView(this); status.setText(rotation==null?"未检测到方向传感器":"转动手机，红色针尖指向磁北"); status.setTextColor(0xff91a995); status.setTextSize(10); status.setGravity(Gravity.CENTER); root.addView(status,new LinearLayout.LayoutParams(-1,dp(26)));
        setContentView(root);
    }
    private int dp(float v){return (int)(v*getResources().getDisplayMetrics().density+.5f);}
    @Override protected void onResume(){super.onResume();if(rotation!=null)sm.registerListener(this,rotation,SensorManager.SENSOR_DELAY_GAME);}
    @Override protected void onPause(){super.onPause();sm.unregisterListener(this);}
    @Override public void onSensorChanged(SensorEvent e){
        if(e.sensor.getType()!=Sensor.TYPE_ROTATION_VECTOR)return;
        float[] matrix=new float[9],orientation=new float[3]; SensorManager.getRotationMatrixFromVector(matrix,e.values); SensorManager.getOrientation(matrix,orientation);
        float a=(float)((Math.toDegrees(orientation[0])+360)%360); compass.setAzimuth(a); degrees.setText(String.format(Locale.US,"%03.0f°",a));
        String[] names={"北 N","东北偏北 NNE","东北 NE","东北偏东 ENE","东 E","东南偏东 ESE","东南 SE","东南偏南 SSE","南 S","西南偏南 SSW","西南 SW","西南偏西 WSW","西 W","西北偏西 WNW","西北 NW","西北偏北 NNW"};
        direction.setText(names[(int)Math.floor((a+11.25f)/22.5f)%16]);
    }
    @Override public void onAccuracyChanged(Sensor s,int accuracy){if(status!=null&&accuracy==SensorManager.SENSOR_STATUS_UNRELIABLE)status.setText("磁场干扰较强，请远离磁吸配件并校准");}

    private static class CompassView extends View {
        private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG); private float azimuth=0, density;
        CompassView(Context c){super(c);density=getResources().getDisplayMetrics().density;setLayerType(View.LAYER_TYPE_SOFTWARE,null);}
        private float d(float v){return v*density;}
        private void fill(int color){p.setStyle(Paint.Style.FILL);p.setColor(color);p.setShader(null);}
        private void stroke(int color,float width){p.setStyle(Paint.Style.STROKE);p.setColor(color);p.setStrokeWidth(d(width));p.setStrokeCap(Paint.Cap.ROUND);p.setShader(null);}
        void setAzimuth(float a){azimuth=a;invalidate();}
        @Override protected void onDraw(Canvas c){
            super.onDraw(c); float w=getWidth(),h=getHeight(),cx=w/2f,cy=h*.48f;
            float bw=Math.min(w-d(8),d(370)),bh=Math.min(h-d(18),bw*1.22f); RectF plate=new RectF(cx-bw/2,cy-bh/2,cx+bw/2,cy+bh/2);
            fill(0xff263f33);c.drawRoundRect(plate,d(21),d(21),p);stroke(0xff64836b,2);c.drawRoundRect(plate,d(21),d(21),p);
            RectF rim=new RectF(plate);rim.inset(d(6),d(6));stroke(0x553fe0a0,1);c.drawRoundRect(rim,d(17),d(17),p);
            // Ruler graduations along both sides
            stroke(0xffb5c5a9,.8f);
            for(int i=0;i<=40;i++){float y=cy-bh*.39f+i*bh*.78f/40f;float len=d(i%5==0?12:5);c.drawLine(cx-bw/2+d(8),y,cx-bw/2+d(8)+len,y,p);c.drawLine(cx+bw/2-d(8)-len,y,cx+bw/2-d(8),y,p);}
            fill(0xffb5c5a9);p.setTextSize(d(8));p.setTypeface(Typeface.DEFAULT);c.drawText("CM",cx-bw/2+d(10),cy-bh*.405f,p);c.drawText("CM",cx+bw/2-d(27),cy-bh*.405f,p);
            // Map orienting grid
            stroke(0x667fb58b,.8f);for(int i=-2;i<=2;i++)c.drawLine(cx+d(i*24),cy-d(120),cx+d(i*24),cy+d(120),p);c.drawLine(cx-d(132),cy,cx+d(132),cy,p);
            float r=Math.min(bw*.36f,bh*.30f);
            fill(0x66000000);c.drawCircle(cx+d(2),cy+d(5),r+d(9),p);fill(0xff15251e);c.drawCircle(cx,cy,r+d(9),p);fill(0xffb6c4a8);c.drawCircle(cx,cy,r+d(5),p);fill(0xff344d3d);c.drawCircle(cx,cy,r+d(2),p);fill(0xffd4ddc8);c.drawCircle(cx,cy,r,p);fill(0xff1d3027);c.drawCircle(cx,cy,r-d(3),p);
            c.save();c.rotate(-azimuth,cx,cy);
            for(int i=0;i<360;i++){boolean major=i%30==0,mid=i%10==0;float outer=r-d(9),inner=outer-d(major?14:mid?9:4);stroke(major?0xffe5dfc7:0xffa9b8a2,major?1.4f:.7f);double a=Math.toRadians(i);c.drawLine(cx+(float)Math.sin(a)*inner,cy-(float)Math.cos(a)*inner,cx+(float)Math.sin(a)*outer,cy-(float)Math.cos(a)*outer,p);}
            p.setStyle(Paint.Style.FILL);p.setTypeface(Typeface.create("sans-serif-condensed",Typeface.BOLD));p.setTextAlign(Paint.Align.CENTER);p.setTextSize(d(13));String[] dirs={"N","E","S","W"};
            for(int i=0;i<4;i++){double a=Math.toRadians(i*90);float x=cx+(float)Math.sin(a)*(r-d(34)),y=cy-(float)Math.cos(a)*(r-d(34))+d(5);p.setColor(i==0?0xffed6551:0xffe6e3d2);c.drawText(dirs[i],x,y,p);}
            p.setTextSize(d(8));p.setColor(0xffc4cfbd);for(int i=30;i<360;i+=30){if(i%90==0)continue;double a=Math.toRadians(i);c.drawText(""+i,cx+(float)Math.sin(a)*(r-d(54)),cy-(float)Math.cos(a)*(r-d(54))+d(3),p);}
            Path north=new Path();north.moveTo(cx,cy-r+d(39));north.lineTo(cx-d(9),cy);north.lineTo(cx,cy+d(5));north.lineTo(cx+d(9),cy);north.close();p.setColor(0xffe34f40);c.drawPath(north,p);
            Path south=new Path();south.moveTo(cx,cy+r-d(39));south.lineTo(cx-d(9),cy);south.lineTo(cx,cy+d(5));south.lineTo(cx+d(9),cy);south.close();p.setColor(0xffe9e7d9);c.drawPath(south,p);
            fill(0xff15251e);c.drawCircle(cx,cy,d(5),p);fill(0xffd8cda8);c.drawCircle(cx,cy,d(2),p);c.restore();
            // Fixed direction-of-travel arrow and bearing index
            Path arrow=new Path();arrow.moveTo(cx,cy-r-d(25));arrow.lineTo(cx-d(10),cy-r+d(1));arrow.lineTo(cx,cy-r-d(5));arrow.lineTo(cx+d(10),cy-r+d(1));arrow.close();fill(0xffdfb85e);c.drawPath(arrow,p);stroke(0xffdfb85e,1.4f);c.drawLine(cx,cy-r-d(5),cx,cy-r+d(17),p);
            stroke(0xffd2ddc9,1);c.drawLine(cx,cy-bh/2+d(24),cx,cy-bh/2+d(43),p);c.drawLine(cx,cy+bh/2-d(43),cx,cy+bh/2-d(24),p);
            fill(0xff14241d);c.drawCircle(cx,cy+bh/2-d(18),d(5),p);fill(0xff91a68c);c.drawCircle(cx,cy+bh/2-d(18),d(2),p);
            p.setTextAlign(Paint.Align.CENTER);p.setTypeface(Typeface.DEFAULT_BOLD);p.setTextSize(d(8));p.setColor(0xffd2ddc9);c.drawText("ORIENTING COMPASS",cx,cy+bh/2-d(34),p);
            p.setStyle(Paint.Style.FILL);p.setShader(new LinearGradient(cx-r,cy-r,cx+r,cy+r,0x2affffff,0x00ffffff,Shader.TileMode.CLAMP));c.drawCircle(cx,cy,r-d(4),p);p.setShader(null);
        }
    }
}
