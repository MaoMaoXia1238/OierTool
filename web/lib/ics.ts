/**
 * iCal (ICS) 日历订阅生成工具
 * 按 RFC 5545 生成日历文本，供用户订阅到 Google Calendar / Outlook / 苹果日历等。
 */

/** 生成日历所需的比赛条目（Contest DTO 的最小字段子集） */
export interface IcsContest {
  id: string;
  name: string;
  platform: string;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration: number;
  url: string;
}

/**
 * 将 Date 格式化为 ICS 标准时间（UTC，YYYYMMDDTHHMMSSZ）
 * 例：2026-08-06T14:35:00Z → 20260806T143500Z
 */
export function toIcsDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    throw new Error(`无效的日期: ${date}`);
  }
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * 转义 ICS 文本字段中的特殊字符（RFC 5545 §3.3.11）
 * 反斜杠、分号、逗号、换行必须转义，否则日历解析器会出错。
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * 计算结束时间：优先使用提供的 endTime，否则按 duration 推算
 */
function resolveEndTime(contest: IcsContest): Date {
  if (contest.endTime) {
    return typeof contest.endTime === "string"
      ? new Date(contest.endTime)
      : contest.endTime;
  }
  const start =
    typeof contest.startTime === "string"
      ? new Date(contest.startTime)
      : contest.startTime;
  return new Date(start.getTime() + contest.duration * 60 * 1000);
}

/**
 * 生成完整 ICS 日历文本
 * @param contests - 比赛列表
 * @param options - 日历名称等选项
 * @returns ICS 格式的字符串
 */
export function buildIcsCalendar(
  contests: IcsContest[],
  options?: { calendarName?: string }
): string {
  const calendarName = options?.calendarName ?? "OierTool 竞赛日历";
  const now = toIcsDate(new Date());

  const events = contests
    .map((contest) => {
      const start = toIcsDate(contest.startTime);
      const end = toIcsDate(resolveEndTime(contest));
      const summary = escapeIcsText(contest.name);
      const description = escapeIcsText(
        `平台: ${contest.platform} · 时长: ${contest.duration} 分钟`
      );
      const url = escapeIcsText(contest.url);

      return [
        "BEGIN:VEVENT",
        `UID:contest-${contest.id}@oiertool`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `URL:${url}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OierTool//竞赛日历//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
