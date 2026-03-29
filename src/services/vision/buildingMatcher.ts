import { BuildingMatchResult, YoloPrediction } from "./types";

interface BuildingRule {
  buildingType: string;
  reason: string;
  keywords: string[];
}

const rules: BuildingRule[] = [
  {
    buildingType: "高层住宅",
    reason: "检测到 apartment/residential/balcony 等标签，常见于住宅楼场景。",
    keywords: ["apartment", "residential", "balcony", "window"]
  },
  {
    buildingType: "写字楼",
    reason: "检测到 office/skyscraper/glass-facade 等标签，更接近办公建筑。",
    keywords: ["office", "skyscraper", "glass", "business", "tower"]
  },
  {
    buildingType: "商业综合体",
    reason: "检测到 mall/shop/signboard/storefront 等标签，匹配商场或商业街建筑。",
    keywords: ["mall", "shop", "store", "signboard", "retail"]
  },
  {
    buildingType: "学校建筑",
    reason: "检测到 school/campus/playground/classroom 等标签，匹配教育建筑。",
    keywords: ["school", "campus", "playground", "classroom", "library"]
  },
  {
    buildingType: "医院建筑",
    reason: "检测到 hospital/clinic/ambulance/cross 等标签，匹配医疗建筑。",
    keywords: ["hospital", "clinic", "ambulance", "medical", "cross"]
  },
  {
    buildingType: "体育场馆",
    reason: "检测到 stadium/arena/field/track 等标签，匹配体育建筑。",
    keywords: ["stadium", "arena", "field", "track", "court"]
  },
  {
    buildingType: "宗教建筑",
    reason: "检测到 temple/church/mosque/pagoda 等标签，匹配宗教场所。",
    keywords: ["temple", "church", "mosque", "pagoda", "shrine"]
  },
  {
    buildingType: "工业厂房",
    reason: "检测到 factory/warehouse/chimney/industrial 等标签，匹配工业建筑。",
    keywords: ["factory", "warehouse", "chimney", "industrial", "plant"]
  }
];

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function matchBuildingType(predictions: YoloPrediction[]): BuildingMatchResult {
  if (predictions.length === 0) {
    return {
      buildingType: "未识别到建筑目标",
      confidence: 0,
      reason: "YOLO 未返回有效检测框，请尝试更清晰的建筑照片。",
      sourceLabels: []
    };
  }

  const labels = predictions.map((item) => normalizeLabel(item.className));

  let bestRule: BuildingRule | null = null;
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;

    for (const prediction of predictions) {
      const label = normalizeLabel(prediction.className);
      const matchedKeyword = rule.keywords.find((keyword) => label.includes(keyword));

      if (matchedKeyword) {
        score += prediction.confidence;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (!bestRule || bestScore <= 0) {
    const topPrediction = predictions
      .slice()
      .sort((a, b) => b.confidence - a.confidence)[0];

    return {
      buildingType: "通用建筑",
      confidence: topPrediction.confidence,
      reason: "检测结果未命中预设建筑类型规则，按通用建筑归类。",
      sourceLabels: labels
    };
  }

  const confidence = Math.min(bestScore / Math.max(predictions.length, 1), 1);

  return {
    buildingType: bestRule.buildingType,
    confidence,
    reason: bestRule.reason,
    sourceLabels: labels
  };
}
