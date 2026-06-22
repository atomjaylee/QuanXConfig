/**
 * 量子点播 — Forward Widget（流解析器 / stream resolver）
 *
 * 资源站：http://23.224.101.30 （苹果CMS V10 JSON API）
 * 作用：挂在 Forward 的影片/剧集详情页背后。播放时 Forward 会把
 *       seriesName / type / season / episode 传入 loadResource，
 *       本插件去资源站检索、匹配剧名+季、抽取可直接播放的 .m3u8，返回播放源列表。
 *
 * 站点接口（已实测）：
 *   检索+详情：  GET /api.php/provide/vod/?ac=detail&wd=<关键词>
 *                返回 list[]，每条含 vod_name / vod_year / vod_remarks
 *                / vod_play_from（$$$ 分源）/ vod_play_url（$$$ 分源, # 分集, $ 分「名/URL」）
 *   两个播放源： liangzi（分享链，需网页解析，丢弃）/ lzm3u8（直链 .m3u8，保留）
 */

const SITE_API = "http://23.224.101.30/api.php/provide/vod/";

const CHINESE_NUM_MAP = {
  "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
  "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
};

WidgetMetadata = {
  id: "vod_liangzi",
  title: "量子点播",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "从 23.224.101.30 检索并返回可直接播放的 m3u8 资源",
  author: "Claude",
  site: "http://23.224.101.30",
  globalParams: [
    {
      name: "enable",
      title: "是否启用",
      type: "enumeration",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "禁用", value: "disabled" },
      ],
      value: "enabled",
    },
  ],
  modules: [
    {
      // stream 模块的 id 必须固定为 loadResource
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 仅保留 .m3u8 直链（自动丢弃 liangzi 分享链） */
const isM3U8Url = (url) => (url || "").toLowerCase().includes(".m3u8");

/** 归一化标题：转小写、去空格与常见标点，用于「对撞」匹配 */
function normalizeTitle(s) {
  return (s || "")
    .replace(/[\s：:·・.!！?？/\\、，,。\-—_~|]/g, "")
    .toLowerCase();
}

/**
 * 从剧名中拆出「基础名 + 季号」。
 * 优先识别「第N季 / 第N部」（中文或阿拉伯数字）；
 * 其次把结尾 1~2 位数字当作季号（如「三体2」→ 基础名「三体」第2季），
 * 但要求前缀长度≥2，避免「2012」被误拆。
 */
function extractSeasonInfo(seriesName) {
  if (!seriesName) return { baseName: seriesName, seasonNumber: 1 };

  const cn = seriesName.match(/第([一二三四五六七八九十\d]+)[季部]/);
  if (cn) {
    const val = cn[1];
    const seasonNum = CHINESE_NUM_MAP[val] || parseInt(val, 10) || 1;
    const baseName = seriesName.replace(/第[一二三四五六七八九十\d]+[季部]/, "").trim();
    return { baseName, seasonNumber: seasonNum };
  }

  const dg = seriesName.match(/^(.+?)(\d{1,2})$/);
  if (dg) {
    const prefix = dg[1].trim();
    // 前缀须含非数字且长度≥2，避免「2012」「007」这类纯数字片名被误拆
    if (/\D/.test(prefix) && prefix.length >= 2) {
      return { baseName: prefix, seasonNumber: parseInt(dg[2], 10) || 1 };
    }
  }

  return { baseName: seriesName.trim(), seasonNumber: 1 };
}

/**
 * 资源站的 wd 是模糊 LIKE 匹配，遇到标点会断。
 * 取剧名开头到第一个数字/标点之前的「片名词根」做宽搜索，
 * 例：「斗罗大陆2：绝世唐门」→「斗罗大陆」；再用归一化做本地精确匹配。
 */
function searchKeyword(baseName) {
  const k = (baseName || "").trim();
  const m = k.match(/^[^\s\d：:·・.!！?？/\\、，,。（()\[\]【】\-—_~|]+/);
  if (m && m[0].length >= 2) return m[0];
  return k;
}

/**
 * 把一条影片记录抽成播放源数组 [{name, description, url, _ep}]。
 * 只保留 .m3u8 直链；电视剧带内部 _ep 集号用于后续精确过滤。
 */
function extractPlayInfo(item, type) {
  const { vod_name, vod_play_url, vod_play_from, vod_remarks = "" } = item;
  if (!vod_name || !vod_play_url) return [];

  const playSources = vod_play_url.replace(/#+$/, "").split("$$$");
  const sourceNames = (vod_play_from || "").split("$$$");

  return playSources.flatMap((playSource, i) => {
    const sourceName = sourceNames[i] || "默认源";
    const parts = playSource.split("#").filter(Boolean);
    const isTV = parts.length > 1;
    const results = [];

    if (type === "tv") {
      parts.forEach((ep) => {
        const sep = ep.indexOf("$");
        const epName = sep >= 0 ? ep.slice(0, sep) : "";
        const url = sep >= 0 ? ep.slice(sep + 1) : ep;
        if (isM3U8Url(url)) {
          const m = epName.match(/(\d+)/);
          results.push({
            name: "量子点播",
            description: `${vod_name} · ${epName || "正片"}${vod_remarks ? " · " + vod_remarks : ""} · [${sourceName}]`,
            url: url.trim(),
            _ep: m ? parseInt(m[1], 10) : null,
          });
        }
      });
    } else {
      // 电影：取该源里第一条 .m3u8（标签可能是 HD中字 / 正片 / 第01集 …）
      const first = parts
        .map((p) => {
          const sep = p.indexOf("$");
          return { label: sep >= 0 ? p.slice(0, sep) : "", url: sep >= 0 ? p.slice(sep + 1) : p };
        })
        .find((p) => isM3U8Url(p.url));
      if (first) {
        const label = /^第\d+集$/.test(first.label) ? "正片" : (first.label || "正片");
        results.push({
          name: "量子点播",
          description: `${vod_name} · ${label}${vod_remarks ? " · " + vod_remarks : ""} · [${sourceName}]`,
          url: first.url.trim(),
        });
      }
    }

    return results;
  });
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

async function loadResource(params) {
  const { seriesName, type = "tv", season, episode, enable } = params || {};
  if (enable === "disabled" || !seriesName) return [];

  const { baseName, seasonNumber } = extractSeasonInfo(seriesName);
  const targetSeason = season ? parseInt(season, 10) : seasonNumber;
  const targetEpisode = episode != null && episode !== "" ? parseInt(episode, 10) : null;

  const cacheKey = `lz_vod_${normalizeTitle(baseName)}_s${targetSeason}_${type}`;
  let allResources = [];

  // 1) 读缓存
  try {
    const cached = Widget.storage.get(cacheKey);
    if (cached) {
      const arr = typeof cached === "string" ? JSON.parse(cached) : cached;
      if (Array.isArray(arr)) allResources = arr;
    }
  } catch (e) {}

  // 2) 缓存未命中 → 请求资源站
  if (allResources.length === 0) {
    try {
      const resp = await Widget.http.get(SITE_API, {
        params: { ac: "detail", wd: searchKeyword(baseName) },
        timeout: 10000,
      });
      const data = typeof resp?.data === "string" ? JSON.parse(resp.data) : resp?.data;
      const list = data?.list;

      if (Array.isArray(list) && list.length > 0) {
        const nTarget = normalizeTitle(baseName);

        // 第一轮：归一化「片名相同 + 季号相同」精确匹配
        let matched = list.filter((it) => {
          const info = extractSeasonInfo(it.vod_name);
          return normalizeTitle(info.baseName) === nTarget && info.seasonNumber === targetSeason;
        });

        // 第二轮兜底：精确无果时，按「站内名包含词根」放宽（描述里带真实片名供辨别）
        if (matched.length === 0) {
          matched = list.filter((it) => normalizeTitle(it.vod_name).includes(nTarget));
        }

        allResources = matched.flatMap((it) => extractPlayInfo(it, type));

        // URL 去重
        const seen = new Set();
        allResources = allResources.filter((r) => {
          if (seen.has(r.url)) return false;
          seen.add(r.url);
          return true;
        });

        // 写缓存（3 小时）
        if (allResources.length > 0) {
          try {
            Widget.storage.set(cacheKey, JSON.stringify(allResources), 10800);
          } catch (e) {}
        }
      }
    } catch (e) {
      return [];
    }
  }

  // 3) 电视剧按目标集号精确过滤
  let out = allResources;
  if (type === "tv" && targetEpisode !== null) {
    const padded = `第${String(targetEpisode).padStart(2, "0")}集`;
    const plain = `第${targetEpisode}集`;
    out = allResources.filter((r) => {
      if (r._ep !== undefined && r._ep !== null) return r._ep === targetEpisode;
      return (r.description || "").includes(plain) || (r.description || "").includes(padded);
    });
  }

  // 去掉内部字段
  return out.map(({ _ep, ...rest }) => rest);
}
