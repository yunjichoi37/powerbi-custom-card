"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService, formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import * as d3 from "d3";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import { VisualFormattingSettingsModel } from "./settings";

interface CardDataPoint {
    tooltipRows: VisualTooltipDataItem[];
    yoyText: string | null;
    selectionId: ISelectionId;
}

function findColumnByRole(columns: powerbi.DataViewValueColumns | undefined, role: string): powerbi.DataViewValueColumn | undefined {
    return columns?.find(column => column.source.roles?.[role]);
}

function findColumnsByRole(columns: powerbi.DataViewValueColumns | undefined, role: string): powerbi.DataViewValueColumn[] {
    return columns?.filter(column => column.source.roles?.[role]) ?? [];
}

function getFillColor(value: powerbi.DataViewPropertyValue | undefined, fallback: string): string {
    const fill = value as unknown as { solid?: { color?: string } } | undefined;
    return fill?.solid?.color ?? fallback;
}

const YOY_POSITION_ITEMS: powerbi.IEnumMember[] = [
    { value: "belowValue", displayName: "값 아래" },
    { value: "rightOfValue", displayName: "값 오른쪽" },
    { value: "rightOfTitle", displayName: "제목 오른쪽" }
];

function hexToRgba(hex: string, transparencyPercent: number): string {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const [r, g, b] = match
        ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)]
        : [255, 255, 255];
    const alpha = 1 - Math.min(Math.max(transparencyPercent, 0), 100) / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Power BI's built-in "Display units" translate labels (예: Thousands→천) but keep Western
// 3-digit grouping. Korean readers expect 4-digit grouping (만/억/조), so these tiers
// format large numbers using that convention instead when the report locale is Korean.
const KOREAN_UNIT_TIERS: Array<{ key: string; threshold: number; unit: string }> = [
    { key: "trillion", threshold: 1e12, unit: "조" },
    { key: "hundredMillion", threshold: 1e8, unit: "억" },
    { key: "tenThousand", threshold: 1e4, unit: "만" },
    { key: "thousand", threshold: 1e3, unit: "천" }
];

function roundToText(value: number, decimalPlaces: number): string {
    const factor = Math.pow(10, decimalPlaces);
    const rounded = Math.round(value * factor) / factor;
    return rounded.toLocaleString("ko-KR", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
    });
}

function formatKoreanAuto(value: number, decimalPlaces: number): string {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);

    for (const tier of KOREAN_UNIT_TIERS) {
        if (abs >= tier.threshold) {
            return sign + roundToText(abs / tier.threshold, decimalPlaces) + tier.unit;
        }
    }

    return sign + roundToText(abs, decimalPlaces);
}

function formatKoreanForced(value: number, tierKey: string, decimalPlaces: number): string {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);
    const tier = KOREAN_UNIT_TIERS.find(t => t.key === tierKey);

    return tier
        ? sign + roundToText(abs / tier.threshold, decimalPlaces) + tier.unit
        : sign + roundToText(abs, decimalPlaces);
}

export class Visual implements IVisual {
    private events: IVisualEventService;
    private host: IVisualHost;
    private target: HTMLElement;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private selectionManager: ISelectionManager;
    private cardElements: Array<{ element: HTMLElement; selectionId: ISelectionId }>;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.target.classList.add("card-list");
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, this.target);
        this.selectionManager = this.host.createSelectionManager();
        this.cardElements = [];

        this.selectionManager.registerOnSelectCallback((selectionIds: ISelectionId[]) => {
            this.syncSelectionStyles(selectionIds);
        });

        this.target.addEventListener("click", () => {
            this.selectionManager.clear().then(() => this.syncSelectionStyles([]));
        });

        // Power BI's report canvas listens for wheel events on the whole page (for
        // panning/zooming). Without stopping propagation here, it intercepts scroll
        // gestures before our own overflow:auto container ever gets to handle them.
        this.target.addEventListener("wheel", (event: WheelEvent) => {
            event.stopPropagation();
        });
    }

    private syncSelectionStyles(selectionIds: ISelectionId[]): void {
        const hasSelection = selectionIds.length > 0;

        this.cardElements.forEach(({ element, selectionId }) => {
            const isSelected = selectionIds.some(id => id.equals(selectionId));
            element.classList.toggle("card-item--selected", isSelected);
            element.classList.toggle("card-item--unselected", hasSelection && !isSelected);
        });
    }

    private renderCard(
        titleText: string,
        formattedValue: string,
        yoyText: string | null,
        yoyDirection: "up" | "down" | null,
        tooltipRows: VisualTooltipDataItem[],
        selectionId: ISelectionId,
        yoyPosition: string,
        allowInteractions: boolean,
        increaseColor: string,
        decreaseColor: string,
        showTitle: boolean
    ): void {
        const dataPoint: CardDataPoint = { tooltipRows, yoyText, selectionId };

        const card = document.createElement("div");
        card.className = "card-item";

        const title = showTitle ? document.createElement("div") : null;
        if (title) {
            title.className = "card-title";
            title.textContent = titleText;
        }

        const value = document.createElement("div");
        value.className = "card-value";
        value.textContent = formattedValue;

        const yoy = yoyText ? document.createElement("div") : null;
        if (yoy) {
            yoy.className = `card-yoy card-yoy--${yoyDirection}`;
            yoy.style.color = yoyDirection === "up" ? increaseColor : decreaseColor;
            yoy.textContent = yoyText;
        }

        if (yoy && title && yoyPosition === "rightOfTitle") {
            const titleRow = document.createElement("div");
            titleRow.className = "card-row";
            titleRow.appendChild(title);
            titleRow.appendChild(yoy);
            card.appendChild(titleRow);
            card.appendChild(value);
        } else if (yoy && yoyPosition === "rightOfValue") {
            if (title) {
                card.appendChild(title);
            }
            const valueRow = document.createElement("div");
            valueRow.className = "card-row";
            valueRow.appendChild(value);
            valueRow.appendChild(yoy);
            card.appendChild(valueRow);
        } else {
            if (title) {
                card.appendChild(title);
            }
            card.appendChild(value);
            if (yoy) {
                card.appendChild(yoy);
            }
        }

        this.target.appendChild(card);

        const cardSelection = d3.select(card).datum(dataPoint);
        this.tooltipServiceWrapper.addTooltip<CardDataPoint>(
            cardSelection,
            (d): VisualTooltipDataItem[] => [
                ...d.tooltipRows,
                ...(d.yoyText ? [{ displayName: "전년 대비", value: d.yoyText }] : [])
            ],
            (d) => d.selectionId
        );

        if (allowInteractions) {
            card.addEventListener("click", (event: MouseEvent) => {
                event.stopPropagation();
                const isMultiSelect = event.ctrlKey || event.metaKey;
                this.selectionManager.select(selectionId, isMultiSelect)
                    .then((selectionIds: ISelectionId[]) => this.syncSelectionStyles(selectionIds));
            });
        }

        this.cardElements.push({ element: card, selectionId });
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

        try {
            const dataView = options.dataViews && options.dataViews[0];
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);

            this.target.replaceChildren();
            this.cardElements = [];
            this.target.style.width = `${options.viewport.width}px`;
            this.target.style.height = `${options.viewport.height}px`;
            const allowInteractions = this.host.hostCapabilities.allowInteractions;
            this.target.style.setProperty("--card-border-color", this.formattingSettings.cardStyleSettings.accentColor.value.value);
            this.target.style.setProperty("--card-background", hexToRgba(
                this.formattingSettings.cardStyleSettings.backgroundColor.value.value,
                this.formattingSettings.cardStyleSettings.backgroundTransparency.value
            ));
            this.target.style.setProperty("--card-border-width", `${this.formattingSettings.cardStyleSettings.borderWidth.value}px`);
            this.target.style.setProperty("--card-radius", `${this.formattingSettings.cardStyleSettings.cornerRadius.value}px`);
            this.target.style.setProperty("--card-column-gap", `${this.formattingSettings.layoutSettings.columnGap.value}px`);
            this.target.style.setProperty("--card-row-gap", `${this.formattingSettings.layoutSettings.rowGap.value}px`);
            this.target.style.setProperty("--card-title-font-size", `${this.formattingSettings.cardTitleSettings.titleFontSize.value}px`);
            this.target.style.setProperty("--card-title-color", this.formattingSettings.cardTitleSettings.titleColor.value.value);
            this.target.style.setProperty("--card-value-font-size", `${this.formattingSettings.valueFormatSettings.fontSize.value}px`);
            this.target.style.setProperty("--card-value-color", this.formattingSettings.valueFormatSettings.valueColor.value.value);

            const isFixedLayout = String(this.formattingSettings.layoutSettings.layoutMode.value.value) === "fixed";
            this.formattingSettings.layoutSettings.columns.visible = isFixedLayout;
            this.formattingSettings.layoutSettings.cardWidth.visible = isFixedLayout;
            this.target.classList.toggle("card-list--fixed", isFixedLayout);
            this.target.style.setProperty("--card-columns", `${this.formattingSettings.layoutSettings.columns.value}`);
            this.target.style.setProperty("--card-width", `${this.formattingSettings.layoutSettings.cardWidth.value}px`);
            this.target.style.setProperty("--card-height", `${this.formattingSettings.layoutSettings.cardHeight.value}px`);

            const isManualPadding = String(this.formattingSettings.layoutSettings.paddingMode.value.value) === "manual";
            this.formattingSettings.layoutSettings.paddingTop.visible = isManualPadding;
            this.formattingSettings.layoutSettings.paddingRight.visible = isManualPadding;
            this.formattingSettings.layoutSettings.paddingBottom.visible = isManualPadding;
            this.formattingSettings.layoutSettings.paddingLeft.visible = isManualPadding;

            // When manual, these overrides win via CSS var() fallback; when auto, clearing
            // them lets the card-size-based clamp() formulas in visual.less take back over.
            if (isManualPadding) {
                this.target.style.setProperty("--card-padding-top", `${this.formattingSettings.layoutSettings.paddingTop.value}px`);
                this.target.style.setProperty("--card-padding-right", `${this.formattingSettings.layoutSettings.paddingRight.value}px`);
                this.target.style.setProperty("--card-padding-bottom", `${this.formattingSettings.layoutSettings.paddingBottom.value}px`);
                this.target.style.setProperty("--card-padding-left", `${this.formattingSettings.layoutSettings.paddingLeft.value}px`);
            } else {
                this.target.style.removeProperty("--card-padding-top");
                this.target.style.removeProperty("--card-padding-right");
                this.target.style.removeProperty("--card-padding-bottom");
                this.target.style.removeProperty("--card-padding-left");
            }

            const categorical = dataView && dataView.categorical;
            const categoryColumn = categorical && categorical.categories && categorical.categories[0];
            const measureColumns = findColumnsByRole(categorical?.values, "measure");
            const priorValueColumns = findColumnsByRole(categorical?.values, "priorMeasure");

            const isKorean = this.host.locale?.toLowerCase().startsWith("ko");
            const koreanUnit = String(this.formattingSettings.valueFormatSettings.koreanDisplayUnit.value.value);
            const decimalPlaces = this.formattingSettings.valueFormatSettings.decimalPlaces.value;
            const yoyPosition = String(this.formattingSettings.yoySettings.yoyPosition.value.value);
            const showYoy = this.formattingSettings.yoySettings.showYoy.value;
            const showTitle = this.formattingSettings.cardTitleSettings.showTitle.value;
            const globalIncreaseColor = this.formattingSettings.yoySettings.increaseColor.value.value;
            const globalDecreaseColor = this.formattingSettings.yoySettings.decreaseColor.value.value;

            const formatValue = (rawValue: powerbi.PrimitiveValue, format: string | undefined): string => {
                if (rawValue == null) {
                    return "-";
                }
                if (isKorean && koreanUnit !== "none") {
                    return koreanUnit === "auto"
                        ? formatKoreanAuto(Number(rawValue), decimalPlaces)
                        : formatKoreanForced(Number(rawValue), koreanUnit, decimalPlaces);
                }
                return valueFormatter.create({ format }).format(rawValue);
            };

            const computeYoy = (rawValue: powerbi.PrimitiveValue, priorRawValue: powerbi.PrimitiveValue | null): { text: string | null; direction: "up" | "down" | null } => {
                if (!showYoy || rawValue == null || priorRawValue == null || Number(priorRawValue) === 0) {
                    return { text: null, direction: null };
                }
                const percentChange = ((Number(rawValue) - Number(priorRawValue)) / Math.abs(Number(priorRawValue))) * 100;
                const direction: "up" | "down" = percentChange >= 0 ? "up" : "down";
                const text = `${percentChange >= 0 ? "▲" : "▼"} ${Math.abs(percentChange).toFixed(decimalPlaces)}%`;
                return { text, direction };
            };

            if (categoryColumn && measureColumns.length > 0) {
                // Grouped by category: one card per category row, using the first measure bound to Value,
                // paired against the first field bound to Prior Period Value.
                this.formattingSettings.yoySettings.container = undefined;

                const valueColumn = measureColumns[0];
                const priorValueColumn = priorValueColumns[0];
                const categoryDisplayName = categoryColumn.source.displayName;
                const measureDisplayName = valueColumn.source.displayName;

                categoryColumn.values.forEach((categoryValue, index) => {
                    const rawValue = valueColumn.values[index];
                    const categoryText = categoryValue != null ? String(categoryValue) : "";
                    const formattedValue = formatValue(rawValue, valueColumn.source.format);
                    const priorRawValue = priorValueColumn ? priorValueColumn.values[index] : null;
                    const { text: yoyText, direction: yoyDirection } = computeYoy(rawValue, priorRawValue);

                    const selectionId = this.host.createSelectionIdBuilder()
                        .withCategory(categoryColumn, index)
                        .createSelectionId();

                    this.renderCard(
                        categoryText,
                        formattedValue,
                        yoyText,
                        yoyDirection,
                        [
                            { displayName: categoryDisplayName, value: categoryText },
                            { displayName: measureDisplayName, value: formattedValue }
                        ],
                        selectionId,
                        yoyPosition,
                        allowInteractions,
                        globalIncreaseColor,
                        globalDecreaseColor,
                        showTitle
                    );
                });
            } else if (!categoryColumn && measureColumns.length > 0) {
                // No category: each measure dropped into Value becomes its own card.
                // When there's more than one, each card gets its own "설정 적용 대상"
                // instance in the YoY format section to pick its paired Prior field
                // and show/hide independently (same pattern as Power BI's per-series
                // data label formatting).
                const priorFieldItems: powerbi.IEnumMember[] = [
                    { value: "none", displayName: "없음" },
                    ...priorValueColumns.map(column => ({
                        value: column.source.queryName ?? column.source.displayName,
                        displayName: column.source.displayName
                    }))
                ];

                const defaultPairedValue = priorValueColumns.length === 1
                    ? (priorValueColumns[0].source.queryName ?? priorValueColumns[0].source.displayName)
                    : "none";

                const containerItems: formattingSettings.ContainerItem[] = [];

                measureColumns.forEach(column => {
                    const savedObjects = column.source.objects?.yoy;
                    const showYoyForItem = savedObjects?.showYoyForItem != null ? Boolean(savedObjects.showYoyForItem) : true;
                    const savedPaired = savedObjects?.pairedPriorField != null ? String(savedObjects.pairedPriorField) : defaultPairedValue;
                    const selectedItem = priorFieldItems.find(item => item.value === savedPaired) ?? priorFieldItems[0];

                    const itemIncreaseColor = getFillColor(savedObjects?.increaseColor, globalIncreaseColor);
                    const itemDecreaseColor = getFillColor(savedObjects?.decreaseColor, globalDecreaseColor);
                    const itemYoyPosition = savedObjects?.yoyPosition != null ? String(savedObjects.yoyPosition) : yoyPosition;
                    const selectedPositionItem = YOY_POSITION_ITEMS.find(item => item.value === itemYoyPosition) ?? YOY_POSITION_ITEMS[0];

                    const selector = { metadata: column.source.queryName } as powerbi.data.Selector;

                    const showToggle = new formattingSettings.ToggleSwitch({
                        name: "showYoyForItem",
                        displayName: "이 항목에 대해 표시",
                        value: showYoyForItem,
                        selector
                    });

                    const pairedDropdown = new formattingSettings.ItemDropdown({
                        name: "pairedPriorField",
                        displayName: "짝지을 전년도 필드",
                        items: priorFieldItems,
                        value: selectedItem,
                        selector
                    });

                    const increaseColorPicker = new formattingSettings.ColorPicker({
                        name: "increaseColor",
                        displayName: "YoY increase color",
                        value: { value: itemIncreaseColor },
                        selector
                    });

                    const decreaseColorPicker = new formattingSettings.ColorPicker({
                        name: "decreaseColor",
                        displayName: "YoY decrease color",
                        value: { value: itemDecreaseColor },
                        selector
                    });

                    const positionDropdown = new formattingSettings.ItemDropdown({
                        name: "yoyPosition",
                        displayName: "YoY position",
                        items: YOY_POSITION_ITEMS,
                        value: selectedPositionItem,
                        selector
                    });

                    containerItems.push({
                        displayName: column.source.displayName,
                        slices: [showToggle, pairedDropdown, increaseColorPicker, decreaseColorPicker, positionDropdown]
                    } as formattingSettings.ContainerItem);

                    const rawValue = column.values[0];
                    const titleText = column.source.displayName;
                    const formattedValue = formatValue(rawValue, column.source.format);

                    const pairedColumn = showYoyForItem
                        ? priorValueColumns.find(prior => (prior.source.queryName ?? prior.source.displayName) === savedPaired)
                        : undefined;
                    const priorRawValue = pairedColumn ? pairedColumn.values[0] : null;
                    const { text: yoyText, direction: yoyDirection } = computeYoy(rawValue, priorRawValue);

                    const selectionId = this.host.createSelectionIdBuilder()
                        .withMeasure(column.source.queryName)
                        .createSelectionId();

                    this.renderCard(
                        titleText,
                        formattedValue,
                        yoyText,
                        yoyDirection,
                        [{ displayName: titleText, value: formattedValue }],
                        selectionId,
                        itemYoyPosition,
                        allowInteractions,
                        itemIncreaseColor,
                        itemDecreaseColor,
                        showTitle
                    );
                });

                if (measureColumns.length > 1 && priorValueColumns.length > 0) {
                    this.formattingSettings.yoySettings.container = new formattingSettings.Container({
                        displayName: "값별 설정",
                        containerItems
                    });
                } else {
                    this.formattingSettings.yoySettings.container = undefined;
                }
            }

            // Container doesn't merge with the card's own top-level slices into a single
            // "적용 대상: 모두" selector — it just adds its own dropdown + slices block
            // underneath. So once the per-item container appears, hide the top-level
            // increase/decrease/position controls to avoid showing both at once.
            const hasYoyContainer = !!this.formattingSettings.yoySettings.container;
            this.formattingSettings.yoySettings.increaseColor.visible = !hasYoyContainer;
            this.formattingSettings.yoySettings.decreaseColor.visible = !hasYoyContainer;
            this.formattingSettings.yoySettings.yoyPosition.visible = !hasYoyContainer;

            this.syncSelectionStyles(this.selectionManager.getSelectionIds() as unknown as ISelectionId[]);

            this.events.renderingFinished(options);
        }
        catch (error) {
            console.log('Error in update method', error);
            this.events.renderingFailed(options, String(error));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
