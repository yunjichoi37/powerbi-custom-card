"use strict";

import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import ValidatorType = powerbi.visuals.ValidatorType;

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsGroup = formattingSettings.Group;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsSimpleSlice = formattingSettings.SimpleSlice;
import FormattingSettingsModel = formattingSettings.Model;

class CardStyleSettings extends FormattingSettingsCard {
    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background color",
        value: { value: "#FFFFFF" }
    });

    backgroundTransparency = new formattingSettings.NumUpDown({
        name: "backgroundTransparency",
        displayName: "Background transparency (%)",
        value: 0,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 100 }
        }
    });

    accentColor = new formattingSettings.ColorPicker({
        name: "accentColor",
        displayName: "Border color",
        value: { value: "#CCD3DB" }
    });

    borderWidth = new formattingSettings.NumUpDown({
        name: "borderWidth",
        displayName: "Border width",
        value: 1,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 8 }
        }
    });

    cornerRadius = new formattingSettings.NumUpDown({
        name: "cornerRadius",
        displayName: "Corner radius",
        value: 12,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 40 }
        }
    });

    cardGap = new formattingSettings.NumUpDown({
        name: "cardGap",
        displayName: "Card spacing",
        value: 12
    });

    name: string = "cardStyle";
    displayName: string = "카드 스타일";
    slices: Array<FormattingSettingsSlice> = [this.backgroundColor, this.backgroundTransparency, this.accentColor, this.borderWidth, this.cornerRadius, this.cardGap];
}

class CardTitleSettings extends FormattingSettingsCard {
    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Show title",
        value: true
    });

    titleFontSize = new formattingSettings.NumUpDown({
        name: "titleFontSize",
        displayName: "Title text size",
        value: 12
    });

    titleColor = new formattingSettings.ColorPicker({
        name: "titleColor",
        displayName: "Title color",
        value: { value: "#4E606F" }
    });

    name: string = "cardTitle";
    displayName: string = "카드 제목";
    topLevelSlice: FormattingSettingsSimpleSlice = this.showTitle;
    slices: Array<FormattingSettingsSlice> = [this.titleFontSize, this.titleColor];
}

class ValueFormatSettings extends FormattingSettingsCard {
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Value text size",
        value: 20
    });

    valueColor = new formattingSettings.ColorPicker({
        name: "valueColor",
        displayName: "Value color",
        value: { value: "#0A1317" }
    });

    decimalPlaces = new formattingSettings.NumUpDown({
        name: "decimalPlaces",
        displayName: "Decimal places",
        value: 1,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 4 }
        }
    });

    koreanDisplayUnit = new formattingSettings.ItemDropdown({
        name: "koreanDisplayUnit",
        displayName: "한국어 표시 단위",
        items: [
            { value: "auto", displayName: "자동" },
            { value: "none", displayName: "없음" },
            { value: "thousand", displayName: "천" },
            { value: "tenThousand", displayName: "만" },
            { value: "hundredMillion", displayName: "억" },
            { value: "trillion", displayName: "조" }
        ],
        value: { value: "auto", displayName: "자동" }
    });

    name: string = "valueFormat";
    displayName: string = "값 표시";
    slices: Array<FormattingSettingsSlice> = [this.fontSize, this.valueColor, this.decimalPlaces, this.koreanDisplayUnit];
}

class LayoutSettings extends FormattingSettingsCompositeCard {
    layoutMode = new formattingSettings.ItemDropdown({
        name: "layoutMode",
        displayName: "Layout",
        items: [
            { value: "auto", displayName: "자동(반응형)" },
            { value: "fixed", displayName: "고정 열 수" }
        ],
        value: { value: "auto", displayName: "자동(반응형)" }
    });

    columns = new formattingSettings.NumUpDown({
        name: "columns",
        displayName: "Columns",
        value: 4,
        options: {
            minValue: { type: ValidatorType.Min, value: 1 },
            maxValue: { type: ValidatorType.Max, value: 12 }
        }
    });

    cardWidth = new formattingSettings.NumUpDown({
        name: "cardWidth",
        displayName: "Card width",
        value: 140,
        options: {
            minValue: { type: ValidatorType.Min, value: 60 },
            maxValue: { type: ValidatorType.Max, value: 600 }
        }
    });

    cardHeight = new formattingSettings.NumUpDown({
        name: "cardHeight",
        displayName: "Card height",
        value: 100,
        options: {
            minValue: { type: ValidatorType.Min, value: 40 },
            maxValue: { type: ValidatorType.Max, value: 400 }
        }
    });

    paddingMode = new formattingSettings.ItemDropdown({
        name: "paddingMode",
        displayName: "Card padding",
        items: [
            { value: "auto", displayName: "자동" },
            { value: "manual", displayName: "직접 지정" }
        ],
        value: { value: "auto", displayName: "자동" }
    });

    paddingTop = new formattingSettings.NumUpDown({
        name: "paddingTop",
        displayName: "Padding top",
        value: 16,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 60 }
        }
    });

    paddingRight = new formattingSettings.NumUpDown({
        name: "paddingRight",
        displayName: "Padding right",
        value: 16,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 60 }
        }
    });

    paddingBottom = new formattingSettings.NumUpDown({
        name: "paddingBottom",
        displayName: "Padding bottom",
        value: 16,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 60 }
        }
    });

    paddingLeft = new formattingSettings.NumUpDown({
        name: "paddingLeft",
        displayName: "Padding left",
        value: 16,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 60 }
        }
    });

    layoutGroup = new FormattingSettingsGroup({
        name: "layoutGroup",
        displayName: "Layout",
        slices: [this.layoutMode, this.columns]
    });

    placementGroup = new FormattingSettingsGroup({
        name: "placementGroup",
        displayName: "배치",
        slices: [this.cardWidth, this.cardHeight]
    });

    paddingGroup = new FormattingSettingsGroup({
        name: "paddingGroup",
        displayName: "여백",
        slices: [this.paddingMode, this.paddingTop, this.paddingRight, this.paddingBottom, this.paddingLeft]
    });

    name: string = "layout";
    displayName: string = "레이아웃";
    groups: Array<FormattingSettingsGroup> = [this.layoutGroup, this.placementGroup, this.paddingGroup];
}

class YoySettings extends FormattingSettingsCard {
    increaseColor = new formattingSettings.ColorPicker({
        name: "increaseColor",
        displayName: "YoY increase color",
        value: { value: "#D64550" }
    });

    decreaseColor = new formattingSettings.ColorPicker({
        name: "decreaseColor",
        displayName: "YoY decrease color",
        value: { value: "#118DFF" }
    });

    yoyPosition = new formattingSettings.ItemDropdown({
        name: "yoyPosition",
        displayName: "YoY position",
        items: [
            { value: "belowValue", displayName: "값 아래" },
            { value: "rightOfValue", displayName: "값 오른쪽" },
            { value: "rightOfTitle", displayName: "제목 오른쪽" }
        ],
        value: { value: "belowValue", displayName: "값 아래" }
    });

    showYoy = new formattingSettings.ToggleSwitch({
        name: "showYoy",
        displayName: "Show YoY",
        value: true
    });

    name: string = "yoy";
    displayName: string = "전년 대비 (YoY)";
    topLevelSlice: FormattingSettingsSimpleSlice = this.showYoy;
    slices: Array<FormattingSettingsSlice> = [this.increaseColor, this.decreaseColor, this.yoyPosition];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    cardStyleSettings = new CardStyleSettings();
    cardTitleSettings = new CardTitleSettings();
    valueFormatSettings = new ValueFormatSettings();
    layoutSettings = new LayoutSettings();
    yoySettings = new YoySettings();

    cards = [this.cardStyleSettings, this.cardTitleSettings, this.valueFormatSettings, this.layoutSettings, this.yoySettings];
}
