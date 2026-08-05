/**
 * 在线 IDE 语言定义：支持的语言、默认模板与竞赛代码片段。
 * 片段使用 CodeMirror snippetCompletion 语法（${} 占位符），
 * 输入前缀即可触发带占位符的代码展开。
 */
import { snippetCompletion, type Completion } from "@codemirror/autocomplete";

/** 支持的语言标识 */
export type IdeLanguage = "cpp" | "python" | "java";

/** 语言元信息（标签、文件扩展名、localStorage 草稿键） */
export const LANGUAGE_META: Record<
  IdeLanguage,
  { label: string; extension: string; draftKey: string }
> = {
  cpp: { label: "C++", extension: "cpp", draftKey: "oiertool-ide-draft:cpp" },
  python: {
    label: "Python",
    extension: "py",
    draftKey: "oiertool-ide-draft:python",
  },
  java: { label: "Java", extension: "java", draftKey: "oiertool-ide-draft:java" },
};

/** 各语言默认模板（首次打开或点击「重置」时载入） */
export const DEFAULT_TEMPLATES: Record<IdeLanguage, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
  python: `import sys

def main():
    data = sys.stdin.read().split()

if __name__ == "__main__":
    main()
`,
  java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

    }
}
`,
};

/** C++ 竞赛常用片段（前缀触发，含光标占位符） */
const CPP_SNIPPETS: Completion[] = [
  snippetCompletion("#include <bits/stdc++.h>", {
    label: "bits",
    detail: "万能头文件",
    type: "snippet",
  }),
  snippetCompletion("ios::sync_with_stdio(false);\ncin.tie(nullptr);", {
    label: "fastio",
    detail: "快速输入输出",
    type: "snippet",
  }),
  snippetCompletion(
    "for (int ${i} = 0; ${i} < ${n}; ${i}++) {\n\t${}\n}",
    { label: "fori", detail: "for 循环", type: "snippet" }
  ),
  snippetCompletion(
    "for (int ${j} = 0; ${j} < ${m}; ${j}++) {\n\t${}\n}",
    { label: "forj", detail: "for 循环 (j)", type: "snippet" }
  ),
  snippetCompletion("using vi = vector<int>;", {
    label: "vi",
    detail: "vector<int> 别名",
    type: "snippet",
  }),
  snippetCompletion("using pii = pair<int, int>;", {
    label: "pii",
    detail: "pair<int,int> 别名",
    type: "snippet",
  }),
  snippetCompletion("using ll = long long;", {
    label: "ll",
    detail: "long long 别名",
    type: "snippet",
  }),
  snippetCompletion(
    "long long gcd(long long a, long long b) {\n\treturn b == 0 ? a : gcd(b, a % b);\n}",
    { label: "gcd", detail: "最大公约数", type: "snippet" }
  ),
  snippetCompletion(
    "long long qpow(long long a, long long b, long long mod) {\n\tlong long res = 1;\n\ta %= mod;\n\twhile (b > 0) {\n\t\tif (b & 1) res = res * a % mod;\n\t\ta = a * a % mod;\n\t\tb >>= 1;\n\t}\n\treturn res;\n}",
    { label: "qpow", detail: "快速幂", type: "snippet" }
  ),
  snippetCompletion("sort(${arr}.begin(), ${arr}.end());", {
    label: "sort",
    detail: "排序",
    type: "snippet",
  }),
];

/** Python 竞赛常用片段 */
const PYTHON_SNIPPETS: Completion[] = [
  snippetCompletion("${data} = sys.stdin.read().split()", {
    label: "read",
    detail: "一次性读入全部输入",
    type: "snippet",
  }),
  snippetCompletion("${n} = int(input())", {
    label: "input_int",
    detail: "读入单个整数",
    type: "snippet",
  }),
  snippetCompletion("${a} = list(map(int, input().split()))", {
    label: "input_list",
    detail: "读入整数列表",
    type: "snippet",
  }),
  snippetCompletion("for ${i} in range(${n}):\n\t${}", {
    label: "fori",
    detail: "range 循环",
    type: "snippet",
  }),
];

/** Java 竞赛常用片段 */
const JAVA_SNIPPETS: Completion[] = [
  snippetCompletion(
    "BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",
    { label: "br", detail: "快速读入", type: "snippet" }
  ),
  snippetCompletion("StringTokenizer st = new StringTokenizer(br.readLine());", {
    label: "st",
    detail: "按行分词",
    type: "snippet",
  }),
  snippetCompletion(
    "for (int ${i} = 0; ${i} < ${n}; ${i}++) {\n\t${}\n}",
    { label: "fori", detail: "for 循环", type: "snippet" }
  ),
  snippetCompletion("Arrays.sort(${arr});", {
    label: "sort",
    detail: "数组排序",
    type: "snippet",
  }),
];

/** 各语言的自定义片段补全列表 */
export const LANGUAGE_SNIPPETS: Record<IdeLanguage, Completion[]> = {
  cpp: CPP_SNIPPETS,
  python: PYTHON_SNIPPETS,
  java: JAVA_SNIPPETS,
};
