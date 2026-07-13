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

// Declared as the full 3x3 range (the max grid size gridRows/gridColumns allow) so that
// FormattingSettingsService can resolve any previously-saved "row,col" position against
// this list when the model is first populated — before visual.ts narrows `.items` down to
// the currently configured grid size in update(). If this list only covered the default
// grid shape, a saved position outside it would fail to resolve to a valid item and crash.
const ALL_GRID_CELL_ITEMS: powerbi.IEnumMember[] = [1, 2, 3].flatMap(row =>
    [1, 2, 3].map(col => ({ value: `${row},${col}`, displayName: `${row}행 ${col}열` }))
);

class CardStyleSettings extends FormattingSettingsCompositeCard {
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

    backgroundGroup = new FormattingSettingsGroup({
        name: "backgroundGroup",
        displayName: "배경",
        slices: [this.backgroundColor, this.backgroundTransparency]
    });

    borderGroup = new FormattingSettingsGroup({
        name: "borderGroup",
        displayName: "테두리",
        slices: [this.accentColor, this.borderWidth, this.cornerRadius]
    });

    name: string = "cardStyle";
    displayName: string = "카드 스타일";
    groups: Array<FormattingSettingsGroup> = [this.backgroundGroup, this.borderGroup];
}

class CardTitleSettings extends FormattingSettingsCard {
    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Show title",
        value: true
    });

    titleFont = new formattingSettings.FontControl({
        name: "titleFont",
        displayName: "글꼴",
        fontFamily: new formattingSettings.FontPicker({
            name: "titleFontFamily",
            value: "Segoe UI"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "titleFontSize",
            value: 12
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "titleBold",
            value: false
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "titleItalic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "titleUnderline",
            value: false
        })
    });

    titleColor = new formattingSettings.ColorPicker({
        name: "titleColor",
        displayName: "Title color",
        value: { value: "#4E606F" }
    });

    name: string = "cardTitle";
    displayName: string = "카드 제목";
    topLevelSlice: FormattingSettingsSimpleSlice = this.showTitle;
    slices: Array<FormattingSettingsSlice> = [this.titleFont, this.titleColor];
}

class ValueFormatSettings extends FormattingSettingsCard {
    valueFont = new formattingSettings.FontControl({
        name: "valueFont",
        displayName: "글꼴",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "Segoe UI"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            value: 20
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "bold",
            value: false
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "italic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "underline",
            value: false
        })
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
    slices: Array<FormattingSettingsSlice> = [this.valueFont, this.valueColor, this.decimalPlaces, this.koreanDisplayUnit];
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

    paddingBox = new formattingSettings.MarginPadding({
        name: "paddingBox",
        displayName: "안쪽 여백",
        top: new formattingSettings.NumUpDown({
            name: "paddingTop",
            displayName: "Padding top",
            value: 16,
            options: {
                minValue: { type: ValidatorType.Min, value: 0 },
                maxValue: { type: ValidatorType.Max, value: 60 }
            }
        }),
        right: new formattingSettings.NumUpDown({
            name: "paddingRight",
            displayName: "Padding right",
            value: 16,
            options: {
                minValue: { type: ValidatorType.Min, value: 0 },
                maxValue: { type: ValidatorType.Max, value: 60 }
            }
        }),
        bottom: new formattingSettings.NumUpDown({
            name: "paddingBottom",
            displayName: "Padding bottom",
            value: 16,
            options: {
                minValue: { type: ValidatorType.Min, value: 0 },
                maxValue: { type: ValidatorType.Max, value: 60 }
            }
        }),
        left: new formattingSettings.NumUpDown({
            name: "paddingLeft",
            displayName: "Padding left",
            value: 16,
            options: {
                minValue: { type: ValidatorType.Min, value: 0 },
                maxValue: { type: ValidatorType.Max, value: 60 }
            }
        })
    });

    columnGap = new formattingSettings.NumUpDown({
        name: "columnGap",
        displayName: "좌우 여백",
        value: 12
    });

    rowGap = new formattingSettings.NumUpDown({
        name: "rowGap",
        displayName: "상하 여백",
        value: 12
    });

    gridRows = new formattingSettings.NumUpDown({
        name: "gridRows",
        displayName: "행 수",
        value: 3,
        options: {
            minValue: { type: ValidatorType.Min, value: 1 },
            maxValue: { type: ValidatorType.Max, value: 3 }
        }
    });

    gridColumns = new formattingSettings.NumUpDown({
        name: "gridColumns",
        displayName: "열 수",
        value: 1,
        options: {
            minValue: { type: ValidatorType.Min, value: 1 },
            maxValue: { type: ValidatorType.Max, value: 3 }
        }
    });

    titlePosition = new formattingSettings.ItemDropdown({
        name: "titlePosition",
        displayName: "제목 위치",
        items: ALL_GRID_CELL_ITEMS,
        value: { value: "1,1", displayName: "1행 1열" }
    });

    valuePosition = new formattingSettings.ItemDropdown({
        name: "valuePosition",
        displayName: "값 위치",
        items: ALL_GRID_CELL_ITEMS,
        value: { value: "2,1", displayName: "2행 1열" }
    });

    yoyPosition = new formattingSettings.ItemDropdown({
        name: "yoyPosition",
        displayName: "YoY 위치",
        items: ALL_GRID_CELL_ITEMS,
        value: { value: "3,1", displayName: "3행 1열" }
    });

    layoutGroup = new FormattingSettingsGroup({
        name: "layoutGroup",
        displayName: "Layout",
        slices: [this.layoutMode, this.columns]
    });

    placementGroup = new FormattingSettingsGroup({
        name: "placementGroup",
        displayName: "크기",
        slices: [this.cardWidth, this.cardHeight]
    });

    positionGroup = new FormattingSettingsGroup({
        name: "positionGroup",
        displayName: "요소 배치",
        slices: [this.gridRows, this.gridColumns, this.titlePosition, this.valuePosition, this.yoyPosition]
    });

    paddingGroup = new FormattingSettingsGroup({
        name: "paddingGroup",
        displayName: "여백",
        slices: [this.paddingMode, this.paddingBox]
    });

    cardGapGroup = new FormattingSettingsGroup({
        name: "cardGapGroup",
        displayName: "카드 간 여백",
        slices: [this.columnGap, this.rowGap]
    });

    name: string = "layout";
    displayName: string = "레이아웃";
    groups: Array<FormattingSettingsGroup> = [this.layoutGroup, this.placementGroup, this.positionGroup, this.paddingGroup, this.cardGapGroup];
}

class YoySettings extends FormattingSettingsCard {
    yoyFont = new formattingSettings.FontControl({
        name: "yoyFont",
        displayName: "글꼴",
        fontFamily: new formattingSettings.FontPicker({
            name: "yoyFontFamily",
            value: "Segoe UI"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "yoyFontSize",
            value: 12
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "yoyBold",
            value: true
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "yoyItalic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "yoyUnderline",
            value: false
        })
    });

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

    showYoy = new formattingSettings.ToggleSwitch({
        name: "showYoy",
        displayName: "Show YoY",
        value: true
    });

    name: string = "yoy";
    displayName: string = "전년 대비 (YoY)";
    topLevelSlice: FormattingSettingsSimpleSlice = this.showYoy;
    slices: Array<FormattingSettingsSlice> = [this.yoyFont, this.increaseColor, this.decreaseColor];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    cardStyleSettings = new CardStyleSettings();
    cardTitleSettings = new CardTitleSettings();
    valueFormatSettings = new ValueFormatSettings();
    layoutSettings = new LayoutSettings();
    yoySettings = new YoySettings();

    cards = [this.cardStyleSettings, this.cardTitleSettings, this.valueFormatSettings, this.layoutSettings, this.yoySettings];
}
