/**
 * iCal 生成工具单元测试
 * 验证 RFC 5545 格式、特殊字符转义、UID 唯一性、时间格式与结束时间推算。
 */
import { describe, it, expect } from "vitest";
import {
  buildIcsCalendar,
  escapeIcsText,
  toIcsDate,
  type IcsContest,
} from "@/lib/ics";

const mockContests: IcsContest[] = [
  {
    id: "c1",
    name: "Codeforces Round #1000",
    platform: "Codeforces",
    startTime: new Date("2026-08-06T14:35:00Z"),
    endTime: new Date("2026-08-06T17:05:00Z"),
    duration: 150,
    url: "https://codeforces.com/contest/1000",
  },
  {
    id: "c2",
    name: "洛谷月赛, 8月（测试, 转义）",
    platform: "Luogu",
    startTime: new Date("2026-08-10T08:00:00Z"),
    duration: 180, // 无 endTime，应推算为 11:00
    url: "https://www.luogu.com.cn/contest/123",
  },
];

describe("toIcsDate", () => {
  it("应将 Date 格式化为 ICS UTC 时间", () => {
    expect(toIcsDate(new Date("2026-08-06T14:35:00Z"))).toBe("20260806T143500Z");
  });

  it("应接受 ISO 字符串输入", () => {
    expect(toIcsDate("2026-08-06T14:35:00.000Z")).toBe("20260806T143500Z");
  });

  it("无效日期应抛出错误", () => {
    expect(() => toIcsDate("invalid-date")).toThrow();
  });
});

describe("escapeIcsText", () => {
  it("应转义逗号、分号、反斜杠", () => {
    expect(escapeIcsText("a,b;c\\d")).toBe("a\\,b\\;c\\\\d");
  });

  it("应转义换行符", () => {
    expect(escapeIcsText("line1\nline2")).toBe("line1\\nline2");
  });
});

describe("buildIcsCalendar", () => {
  const ics = buildIcsCalendar(mockContests);

  it("应以 BEGIN:VCALENDAR 开头，END:VCALENDAR 结尾", () => {
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics).toMatch(/\r\nEND:VCALENDAR$/);
  });

  it("每个比赛应生成一个 VEVENT", () => {
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(2);
  });

  it("UID 应包含比赛 id 且唯一", () => {
    expect(ics).toContain("UID:contest-c1@oiertool");
    expect(ics).toContain("UID:contest-c2@oiertool");
    const uidMatches = ics.match(/UID:[^\r\n]+/g) ?? [];
    expect(new Set(uidMatches).size).toBe(2);
  });

  it("时间应为 UTC 标准格式", () => {
    expect(ics).toContain("DTSTART:20260806T143500Z");
    expect(ics).toContain("DTEND:20260806T170500Z");
  });

  it("无 endTime 时应按 duration 推算结束时间", () => {
    expect(ics).toContain("DTSTART:20260810T080000Z");
    expect(ics).toContain("DTEND:20260810T110000Z");
  });

  it("特殊字符应被转义（逗号/分号不破坏 ICS 结构）", () => {
    expect(ics).toContain("SUMMARY:洛谷月赛\\, 8月（测试\\, 转义）");
  });

  it("应包含 URL 字段", () => {
    expect(ics).toContain("URL:https://codeforces.com/contest/1000");
  });

  it("空比赛列表仍生成合法日历", () => {
    const empty = buildIcsCalendar([]);
    expect(empty).toMatch(/^BEGIN:VCALENDAR/);
    expect(empty).not.toContain("BEGIN:VEVENT");
  });
});
