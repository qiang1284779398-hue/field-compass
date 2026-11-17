package com.example.fieldcompass

import android.app.Activity
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Typeface
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

class MainActivity : Activity(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var rotationSensor: Sensor? = null
    private var accelSensor: Sensor? = null
    private var magneticSensor: Sensor? = null
    private var compassView: CompassView? = null
    private val rotationMatrix = FloatArray(9)
    private val orientation = FloatArray(3)
    private val accel = FloatArray(3)
    private val magnet = FloatArray(3)
    private var hasAccel = false
    private var hasMagnet = false
    private var heading = 0f
    private var sensorAvailable = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.statusBarColor = android.graphics.Color.rgb(8, 13, 10)
        window.navigationBarColor = android.graphics.Color.rgb(8, 13, 10)
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
        accelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        magneticSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
        sensorAvailable = rotationSensor != null || (accelSensor != null && magneticSensor != null)
        compassView = CompassView(this) { 
            Toast.makeText(this, "校准方法：拿着手机缓慢画 8 字，并远离磁吸手机壳、磁铁和金属物体。", Toast.LENGTH_LONG).show()
        }
        setContentView(compassView)
        compassView?.setSensorState(sensorAvailable)
    }

    override fun onResume() {
        super.onResume()
        rotationSensor?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        if (rotationSensor == null) {
            accelSensor?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
            magneticSensor?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        }
    }

    override fun onPause() {
        super.onPause()
        sensorManager.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ROTATION_VECTOR -> {
                SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
                SensorManager.getOrientation(rotationMatrix, orientation)
                updateHeading(Math.toDegrees(orientation[0].toDouble()).toFloat())
            }
            Sensor.TYPE_ACCELEROMETER -> {
                event.values.copyInto(accel)
                hasAccel = true
                calculateFallback()
            }
            Sensor.TYPE_MAGNETIC_FIELD -> {
                event.values.copyInto(magnet)
                hasMagnet = true
                calculateFallback()
            }
        }
    }

    private fun calculateFallback() {
        if (hasAccel && hasMagnet && SensorManager.getRotationMatrix(rotationMatrix, null, accel, magnet)) {
            SensorManager.getOrientation(rotationMatrix, orientation)
            updateHeading(Math.toDegrees(orientation[0].toDouble()).toFloat())
        }
    }

    private fun updateHeading(value: Float) {
        heading = (value + 360f) % 360f
        runOnUiThread { compassView?.setHeading(heading) }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        compassView?.setAccuracy(accuracy)
    }
}

private class CompassView(context: Context, private val onCalibrate: () -> Unit) : View(context) {
    private val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF080D0A.toInt() }
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF26352B.toInt(); style = Paint.Style.STROKE; strokeWidth = 2f }
    private val green = 0xFFB8F36B.toInt()
    private val muted = 0xFF7D9182.toInt()
    private val white = 0xFFEAF1E9.toInt()
    private val red = 0xFFFF625B.toInt()
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = white; textAlign = Paint.Align.CENTER; typeface = Typeface.create("sans-serif", Typeface.NORMAL) }
    private val boldPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = white; textAlign = Paint.Align.CENTER; typeface = Typeface.create("sans-serif", Typeface.BOLD) }
    private var heading = 0f
    private var sensorOk = true
    private var accuracy = SensorManager.SENSOR_STATUS_ACCURACY_HIGH
    private val density = resources.displayMetrics.density

    fun setHeading(value: Float) { heading = value; invalidate() }
    fun setSensorState(ok: Boolean) { sensorOk = ok; invalidate() }
    fun setAccuracy(value: Int) { accuracy = value; invalidate() }
    private fun dp(v: Float) = v * density

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawColor(0xFF080D0A.toInt())
        val w = width.toFloat(); val h = height.toFloat()
        val cx = w / 2f
        textPaint.textSize = dp(11f); textPaint.color = muted
        canvas.drawText("FIELD NAVIGATION  /  01", cx, dp(42f), textPaint)
        boldPaint.textSize = dp(23f); boldPaint.color = white
        canvas.drawText("户 外 指 北 针", cx, dp(79f), boldPaint)
        textPaint.textSize = dp(10f); textPaint.color = green
        canvas.drawText("MAGNETIC NORTH  ·  磁北", cx, dp(103f), textPaint)

        val top = dp(132f)
        val bottom = h - dp(214f)
        val radius = min(w * 0.435f, (bottom - top) / 2f).coerceAtLeast(dp(100f))
        val cy = top + (bottom - top) / 2f
        canvas.drawCircle(cx, cy, radius + dp(13f), ringPaint)
        canvas.drawCircle(cx, cy, radius + dp(5f), ringPaint)
        canvas.drawCircle(cx, cy, radius, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF101A13.toInt() })
        canvas.drawCircle(cx, cy, radius, ringPaint)

        canvas.save()
        canvas.rotate(-heading, cx, cy)
        for (i in 0 until 360) {
            val major = i % 30 == 0
            val medium = i % 10 == 0
            val inner = radius - when { major -> dp(22f); medium -> dp(15f); else -> dp(9f) }
            val outer = radius - dp(2f)
            val p = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = if (major) green else if (medium) 0xFF718276.toInt() else 0xFF34443A.toInt()
                strokeWidth = if (major) dp(2f) else dp(1f)
            }
            val a = Math.toRadians(i.toDouble())
            canvas.drawLine(cx + (inner * sin(a)).toFloat(), cy - (inner * cos(a)).toFloat(), cx + (outer * sin(a)).toFloat(), cy - (outer * cos(a)).toFloat(), p)
        }
        val labels = listOf("北" to 0, "东" to 90, "南" to 180, "西" to 270)
        for ((label, deg) in labels) {
            val a = Math.toRadians(deg.toDouble())
            val x = cx + ((radius - dp(43f)) * sin(a)).toFloat()
            val y = cy - ((radius - dp(43f)) * cos(a)).toFloat() + dp(7f)
            boldPaint.textSize = dp(22f)
            boldPaint.color = if (deg == 0) red else white
            canvas.drawText(label, x, y, boldPaint)
        }
        canvas.restore()

        // Fixed heading marker at the top of the dial.
        val marker = Path().apply {
            moveTo(cx, cy - radius - dp(5f)); lineTo(cx - dp(9f), cy - radius + dp(12f));
            lineTo(cx + dp(9f), cy - radius + dp(12f)); close()
        }
        canvas.drawPath(marker, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = green; style = Paint.Style.FILL })
        // Needle: north half red, south half pale.
        val needle = Path().apply {
            moveTo(cx, cy - radius * 0.57f); lineTo(cx - dp(12f), cy + dp(8f));
            lineTo(cx, cy + dp(1f)); lineTo(cx + dp(12f), cy + dp(8f)); close()
        }
        canvas.drawPath(needle, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = red; style = Paint.Style.FILL })
        val south = Path().apply {
            moveTo(cx, cy + radius * 0.57f); lineTo(cx - dp(12f), cy - dp(8f));
            lineTo(cx, cy - dp(1f)); lineTo(cx + dp(12f), cy - dp(8f)); close()
        }
        canvas.drawPath(south, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFD7E1D8.toInt(); style = Paint.Style.FILL })
        canvas.drawCircle(cx, cy, dp(7f), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = green })
        canvas.drawCircle(cx, cy, dp(3f), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF101A13.toInt() })

        val deg = heading.toInt()
        boldPaint.color = green; boldPaint.textSize = dp(46f)
        canvas.drawText(String.format("%03d°", deg), cx, h - dp(143f), boldPaint)
        textPaint.color = white; textPaint.textSize = dp(15f)
        canvas.drawText(directionName(heading), cx, h - dp(116f), textPaint)
        textPaint.color = muted; textPaint.textSize = dp(11f)
        val status = when {
            !sensorOk -> "此手机未检测到可用的方向传感器"
            accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE -> "传感器精度低 · 请远离磁铁并校准"
            accuracy == SensorManager.SENSOR_STATUS_ACCURACY_LOW -> "传感器精度较低 · 建议校准"
            else -> "传感器已连接  ·  仅供辅助导航"
        }
        canvas.drawText(status, cx, h - dp(78f), textPaint)
        val btnW = dp(174f); val btnH = dp(42f); val bx = cx - btnW / 2f; val by = h - dp(60f)
        canvas.drawRoundRect(bx, by, bx + btnW, by + btnH, dp(21f), dp(21f), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF1B2A20.toInt() })
        textPaint.color = green; textPaint.textSize = dp(13f)
        canvas.drawText("校准指南  ·  CALIBRATE", cx, by + dp(26f), textPaint)
        if (!sensorOk) {
            textPaint.color = red; textPaint.textSize = dp(12f)
            canvas.drawText("手机硬件可能不支持电子指南针", cx, cy + radius + dp(38f), textPaint)
        }
    }

    private fun directionName(deg: Float): String {
        val names = arrayOf("北", "北偏东北", "东北", "东偏东北", "东", "东偏东南", "东南", "南偏东南", "南", "南偏西南", "西南", "西偏西南", "西", "西偏西北", "西北", "北偏西北")
        return names[((deg + 11.25f) / 22.5f).toInt() % 16]
    }

    override fun onTouchEvent(event: android.view.MotionEvent): Boolean {
        if (event.action == android.view.MotionEvent.ACTION_UP) {
            val y = height - dp(60f)
            if (event.y >= y - dp(8f)) onCalibrate()
            return true
        }
        return true
    }
}
