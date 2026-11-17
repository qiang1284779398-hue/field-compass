package com.outdoor.compass;

import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import java.util.Locale;

public class MainActivity extends Activity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor rotationSensor;
    private CompassView compassView;
    private float heading = 0f;
    private boolean sensorAvailable = false;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.setStatusBarColor(Color.rgb(10, 18, 15));
        w.setNavigationBarColor(Color.rgb(10, 18, 15));
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        }
        sensorAvailable = rotationSensor != null;
        compassView = new CompassView(this);
        setContentView(compassView);
    }

    @Override protected void onResume() {
        super.onResume();
        if (sensorManager != null && rotationSensor != null) {
            sensorManager.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_GAME);
        }
    }

    @Override protected void onPause() {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        super.onPause();
    }

    @Override public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_ROTATION_VECTOR) return;
        float[] rotation = new float[9];
        float[] orientation = new float[3];
        SensorManager.getRotationMatrixFromVector(rotation, event.values);
        int rotationDisplay = getWindowManager().getDefaultDisplay().getRotation();
        int axisX = SensorManager.AXIS_X;
        int axisY = SensorManager.AXIS_Y;
        if (rotationDisplay == android.view.Surface.ROTATION_90) {
            axisX = SensorManager.AXIS_Y;
            axisY = SensorManager.AXIS_MINUS_X;
        } else if (rotationDisplay == android.view.Surface.ROTATION_180) {
            axisX = SensorManager.AXIS_MINUS_X;
            axisY = SensorManager.AXIS_MINUS_Y;
        } else if (rotationDisplay == android.view.Surface.ROTATION_270) {
            axisX = SensorManager.AXIS_MINUS_Y;
            axisY = SensorManager.AXIS_X;
        }
        float[] adjusted = new float[9];
        SensorManager.remapCoordinateSystem(rotation, axisX, axisY, adjusted);
        SensorManager.getOrientation(adjusted, orientation);
        float degrees = (float) Math.toDegrees(orientation[0]);
        degrees = (degrees + 360f) % 360f;

        // Smooth across the 0/360 boundary.
        float delta = ((degrees - heading + 540f) % 360f) - 180f;
        heading = (heading + delta * 0.22f + 360f) % 360f;
        if (compassView != null) compassView.invalidate();
    }

    @Override public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (compassView != null) compassView.invalidate();
    }

    private class CompassView extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final int bg = Color.rgb(10, 18, 15);
        private final int green = Color.rgb(116, 174, 132);
        private final int muted = Color.rgb(125, 145, 132);
        private final int white = Color.rgb(231, 238, 232);
        private final int red = Color.rgb(225, 83, 73);

        CompassView(Context c) { super(c); setLayerType(View.LAYER_TYPE_SOFTWARE, null); }

        private float dp(float v) { return v * getResources().getDisplayMetrics().density; }

        @Override protected void onDraw(Canvas c) {
            super.onDraw(c);
            float w = getWidth(), h = getHeight();
            float cx = w / 2f;
            c.drawColor(bg);

            p.setStyle(Paint.Style.FILL);
            p.setColor(white);
            p.setTextAlign(Paint.Align.CENTER);
            p.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
            p.setTextSize(dp(17));
            c.drawText("FIELD COMPASS", cx, dp(54), p);
            p.setColor(muted);
            p.setTextSize(dp(11));
            p.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
            c.drawText("户 外 电 子 指 南 针", cx, dp(78), p);

            float radius = Math.min(w * 0.405f, (h - dp(260)) * 0.43f);
            radius = Math.max(dp(95), radius);
            float cy = Math.max(h * 0.43f, dp(245));

            p.setColor(Color.rgb(22, 34, 28));
            p.setStyle(Paint.Style.FILL);
            c.drawCircle(cx, cy, radius + dp(15), p);
            p.setColor(Color.rgb(51, 73, 59));
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(dp(1.5f));
            c.drawCircle(cx, cy, radius + dp(8), p);
            p.setColor(green);
            p.setStrokeWidth(dp(2));
            c.drawCircle(cx, cy, radius, p);

            c.save();
            c.rotate(-heading, cx, cy);
            for (int i = 0; i < 360; i += 5) {
                boolean major = i % 30 == 0;
                boolean mediumTick = i % 10 == 0;
                float outer = radius - dp(8);
                float inner = outer - (major ? dp(18) : mediumTick ? dp(11) : dp(5));
                double a = Math.toRadians(i);
                p.setColor(major ? green : muted);
                p.setStrokeWidth(major ? dp(2) : dp(1));
                c.drawLine(cx + (float)Math.sin(a)*inner, cy - (float)Math.cos(a)*inner,
                           cx + (float)Math.sin(a)*outer, cy - (float)Math.cos(a)*outer, p);
            }
            String[] labels = {"N","E","S","W"};
            int[] degs = {0,90,180,270};
            p.setStyle(Paint.Style.FILL);
            p.setTypeface(Typeface.create("sans-serif-bold", Typeface.BOLD));
            p.setTextSize(dp(19));
            for (int i=0;i<4;i++) {
                double a = Math.toRadians(degs[i]);
                float x = cx + (float)Math.sin(a)*(radius-dp(37));
                float y = cy - (float)Math.cos(a)*(radius-dp(37)) + dp(7);
                p.setColor(i==0 ? red : white);
                c.drawText(labels[i], x, y, p);
            }
            c.restore();

            // Fixed lubber line at the top; needle rotates with the dial.
            Path marker = new Path();
            marker.moveTo(cx, cy-radius-dp(7));
            marker.lineTo(cx-dp(9), cy-radius+dp(10));
            marker.lineTo(cx+dp(9), cy-radius+dp(10));
            marker.close();
            p.setColor(green); p.setStyle(Paint.Style.FILL);
            c.drawPath(marker,p);

            // Needle points to magnetic north; the dial rotates under the fixed marker.
            c.save();
            c.rotate(-heading, cx, cy);
            Path north = new Path();
            north.moveTo(cx,cy-radius*0.56f);
            north.lineTo(cx-dp(11),cy+dp(7));
            north.lineTo(cx,cy+dp(1));
            north.lineTo(cx+dp(11),cy+dp(7));
            north.close();
            p.setColor(red); c.drawPath(north,p);
            Path south = new Path();
            south.moveTo(cx,cy+radius*0.56f);
            south.lineTo(cx-dp(11),cy-dp(7));
            south.lineTo(cx,cy-dp(1));
            south.lineTo(cx+dp(11),cy-dp(7));
            south.close();
            p.setColor(white); c.drawPath(south,p);
            c.restore();

            p.setColor(green); c.drawCircle(cx,cy,dp(7),p);
            p.setColor(Color.rgb(20,35,27)); c.drawCircle(cx,cy,dp(3),p);

            float dataY = h - dp(154);
            p.setColor(white);
            p.setTextSize(dp(48));
            p.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
            c.drawText(String.format(Locale.US,"%03d°",Math.round(heading)%360),cx,dataY,p);

            p.setColor(green);
            p.setTextSize(dp(17));
            p.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));
            c.drawText(direction(heading),cx,dataY+dp(31),p);

            p.setColor(muted);
            p.setTextSize(dp(12));
            p.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));
            String status = sensorAvailable ? "方向传感器已连接 · 磁北参考" : "未检测到方向传感器";
            c.drawText(status,cx,h-dp(67),p);
            c.drawText("远离磁铁、电机及金属物体可提高精度",cx,h-dp(43),p);
        }

        private String direction(float d) {
            String[] n={"北","北偏东北","东北","东偏东北","东","东偏东南","东南","南偏东南",
                        "南","南偏西南","西南","西偏西南","西","西偏西北","西北","北偏西北"};
            return n[((int)((d+11.25f)/22.5f))%16];
        }
    }
}
