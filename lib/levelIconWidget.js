'use strict';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';

import {VectorImages} from './vectorImages.js';

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion45 = Number.parseInt(major) < 46;

// Credits: to https://github.com/Deminder for this https://github.com/Deminder/battery-indicator-icon/blob/main/src/modules/drawicon.js

export const LevelIconWidget = GObject.registerClass(
class LevelIconWidget extends St.DrawingArea {
    _init(iconSize, iconType, widgetInfo) {
        super._init({
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: '',
        });
        this.width = iconSize;
        this.height = iconSize;
        this._widgetInfo = widgetInfo;
        this._iconType = iconType;
        log(`--- iconType --- ${iconType}`);
    }

    updateValues(percentage) {
        this._percentage = percentage;
        this.queue_repaint();
    }

    _setSourceColor(cr, color) {
        if (shellVersion45)
            Clutter.cairo_set_source_color(cr, color);
        else
            cr.setSourceColor(color);
    }

    get iconColors() {
        return this.get_theme_node().get_icon_colors();
    }

    _assignWidgetColor(colors) {
        const clutterColor = hexColor => Clutter.Color.from_string(hexColor)[1];
        let color;
        if (this._widgetInfo.levelIndicatorColor === 0) {
            color = this._percentage > 20 ? colors.symbolicColor : colors.warningColor;
        } else if (this._widgetInfo.levelIndicatorColor === 1) {
            color = this._percentage > 20 ? clutterColor('#15c931') : clutterColor('#ff7800');
        } else {
            let hex;
            if (this._percentage > 90)
                hex = this._widgetInfo.color100;
            else if (this._percentage > 80 && this._percentage <= 90)
                hex = this._widgetInfo.color90;
            else if (this._percentage > 70 && this._percentage <= 80)
                hex = this._widgetInfo.color80;
            else if (this._percentage > 60 && this._percentage <= 70)
                hex = this._widgetInfo.color70;
            else if (this._percentage > 50 && this._percentage <= 60)
                hex = this._widgetInfo.color60;
            else if (this._percentage > 40 && this._percentage <= 50)
                hex = this._widgetInfo.color50;
            else if (this._percentage > 30 && this._percentage <= 40)
                hex = this._widgetInfo.color40;
            else if (this._percentage > 20 && this._percentage <= 30)
                hex = this._widgetInfo.color30;
            else if (this._percentage > 10 && this._percentage <= 20)
                hex = this._widgetInfo.color20;
            else if (this._percentage <= 10)
                hex = this._widgetInfo.color10;

            color = clutterColor(hex);
        }
        return color;
    }

    _addVectorImage(cr, colors, path)  {
        this._setSourceColor(cr, colors.symbolicColor);
        cr.translate(0, 0);
        let currentX = 0;
        let currentY = 0;
        const vectorPath = path.split(' ');
        for (let i = 0; i < vectorPath.length; i++) {
            if (vectorPath[i] === 'M') {
                currentX = parseFloat(vectorPath[i + 1]);
                currentY = parseFloat(vectorPath[i + 2]);
                cr.moveTo(currentX, currentY);
                i += 2;
            } else if (vectorPath[i] === 'L') {
                currentX = parseFloat(vectorPath[i + 1]);
                currentY = parseFloat(vectorPath[i + 2]);
                cr.lineTo(currentX, currentY);
                i += 2;
            } else if (vectorPath[i] === 'H') {
                currentX = parseFloat(vectorPath[i + 1]);
                cr.lineTo(currentX, currentY);
                i += 1;
            } else if (vectorPath[i] === 'V') {
                currentY = parseFloat(vectorPath[i + 1]);
                cr.lineTo(currentX, currentY);
                i += 1;
            } else if (vectorPath[i] === 'C') {
                const x1 = parseFloat(vectorPath[i + 1]);
                const y1 = parseFloat(vectorPath[i + 2]);
                const x2 = parseFloat(vectorPath[i + 3]);
                const y2 = parseFloat(vectorPath[i + 4]);
                const x3 = parseFloat(vectorPath[i + 5]);
                const y3 = parseFloat(vectorPath[i + 6]);
                cr.curveTo(x1, y1, x2, y2, x3, y3);
                currentX = x3;
                currentY = y3;
                i += 6;
            } else if (vectorPath[i] === 'Z') {
                cr.closePath();
            }
        }
        cr.fill();
    }

    _drawBatteryBarLevel(cr, colors) {
        const drawRoundedRect = (ctx, x, y, width, height, radius) => {
            ctx.newPath();
            ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
            ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
            ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
            ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI);
            ctx.closePath();
            ctx.fill();
        };
        this._setSourceColor(cr, colors.symbolicOpaqueColor);
        drawRoundedRect(cr, 0.5, 13.4, 14.5, 2.6, 0.15);
        drawRoundedRect(cr, 15, 13.950, 0.5, 1.5, 0.15);
        this._setSourceColor(cr, this._assignWidgetColor(colors));
        const fillLevelwidth = 14.5 * this._percentage / 100;
        drawRoundedRect(cr, 0.5, 13.4, fillLevelwidth, 2.6, 0.15);
    }

    _drawDotLevel(cr, colors) {
        const drawCircle = (ctx, cx, cy, r) => {
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fill();
        };
        this._setSourceColor(cr, this._assignWidgetColor(colors));
        if (this._percentage > 75) {
            drawCircle(cr, 1.8, 14.7, 1.3);
            drawCircle(cr, 5.9333334, 14.7, 1.3);
            drawCircle(cr, 10.066667, 14.7, 1.3);
            drawCircle(cr, 14.2, 14.7, 1.3);
        } else if (this._percentage <= 75 && this._percentage > 50) {
            drawCircle(cr, 3.8666666, 14.7, 1.3);
            drawCircle(cr, 8, 14.7, 1.3);
            drawCircle(cr, 12.133333, 14.7, 1.3);
        } else if (this._percentage <= 50 && this._percentage > 25) {
            drawCircle(cr, 5.9333334, 14.7, 1.3);
            drawCircle(cr, 10.066667, 14.7, 1.3);
        } else if (this._percentage <= 25) {
            drawCircle(cr, 8, 14.7, 1.3);
        }
    }

    _drawWidget(cr, w, h, colors) {
        cr.translate(0, 0);
        cr.scale(w / 16, h / 16);
        this._addVectorImage(cr, colors, VectorImages[this._iconType]);
        if (this._widgetInfo.levelIndicatorType === 0)
            this._drawBatteryBarLevel(cr, colors);
        else
            this._drawDotLevel(cr, colors);
    }

    vfunc_repaint() {
        const iconColors = this.iconColors;
        const symbolicColor = iconColors.foreground;
        const symbolicOpaqueColor = symbolicColor.copy();
        symbolicOpaqueColor.alpha *= 0.5;
        const warningColor =  iconColors.warning;
        const colors = {symbolicColor, symbolicOpaqueColor, warningColor};
        const cr = this.get_context();
        const [w, h] = this.get_surface_size();
        this._drawWidget(cr, w, h, colors);
        cr.$dispose();
    }
}
);

