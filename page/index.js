import * as hmUI from "@zos/ui";
import { Compass } from "@zos/sensor";

let compass = null;
let needleWidget = null;
let angleWidget = null;
let directionWidget = null;
let statusWidget = null;

function setText(widget, text) {
  if (widget) {
    widget.setProperty(hmUI.prop.MORE, { text: text });
  }
}

function refreshCompass() {
  if (!compass || !needleWidget) return;

  const calibrated = compass.getStatus();
  const angle = compass.getDirectionAngle();

  if (calibrated && typeof angle === "number") {
    const bearing = Math.round((angle + 360) % 360);
    // The needle points to magnetic north relative to the watch's 12 o'clock direction.
    const northOnScreen = (360 - bearing) % 360;

    needleWidget.setProperty(hmUI.prop.MORE, {
      angle: northOnScreen
    });
    setText(angleWidget, String(bearing).padStart(3, "0") + "°");
    setText(directionWidget, compass.getDirection());
    setText(statusWidget, "已校准 · 磁北方向");
  } else {
    setText(angleWidget, "---°");
    setText(directionWidget, "--");
    setText(statusWidget, "请移动手腕画 8 字校准");
  }
}

Page({
  build() {
    hmUI.createWidget(hmUI.widget.IMG, {
      x: 0,
      y: 0,
      w: 480,
      h: 480,
      src: "dial.png"
    });

    needleWidget = hmUI.createWidget(hmUI.widget.IMG, {
      x: 0,
      y: 0,
      w: 480,
      h: 480,
      src: "needle.png",
      angle: 0,
      center_x: 240,
      center_y: 240
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 80,
      y: 36,
      w: 320,
      h: 42,
      text: "FIELD COMPASS",
      color: 0x9eafa4,
      text_size: 23,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });

    angleWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 115,
      y: 322,
      w: 250,
      h: 62,
      text: "---°",
      color: 0xf0bd73,
      text_size: 54,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });

    directionWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 150,
      y: 380,
      w: 180,
      h: 38,
      text: "--",
      color: 0xf1f3ed,
      text_size: 28,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });

    statusWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 45,
      y: 424,
      w: 390,
      h: 30,
      text: "正在启动指南针…",
      color: 0x91a397,
      text_size: 18,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });

    compass = new Compass();
    compass.onChange(refreshCompass);
    compass.start();
    refreshCompass();
  },

  onDestroy() {
    if (compass) {
      compass.offChange(refreshCompass);
      compass.stop();
      compass = null;
    }
  }
});