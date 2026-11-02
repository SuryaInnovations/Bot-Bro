/**
 * BOT BRO — Central Coding Response & Developer Identity System
 *
 * Core Principles:
 * 1. Understand deeply, answer simply.
 * 2. Official Developer Identity: Surya bro ("I was developed by Surya bro! 😊").
 * 3. Default Coding Behavior: Basic, beginner-level school/college student code.
 * 4. Write code directly in the main script body using simple variables, input(), and print().
 * 5. NEVER define functions (no def, no lambda, no methods) for simple exercises unless requested.
 * 6. NO docstrings, NO type annotations, NO main guards (if __name__ == "__main__":).
 * 7. NO list comprehensions, generator expressions, or sets for simple exercises.
 * 8. NO comments inside code by default (unless user explicitly requests comments).
 * 9. NO separate example-usage sections or test cases.
 * 10. Explanations outside the code block in 3-5 simple, clear bullet points.
 * 11. Strict respect for user overrides (with comments, code only, line by line, functions).
 * 12. Automated quality check & correction loop for beginner code responses.
 */

export type CodingComplexityLevel = 1 | 2 | 3;

export interface CodingRequestContext {
  isCoding: boolean;
  detectedLanguages: string[];
  complexityLevel: CodingComplexityLevel; // 1 = Beginner/Student, 2 = Intermediate/Functions, 3 = Advanced/DSA
  isLevel1Beginner: boolean;
  isExplicitFunctionRequest: boolean;
  isExplicitWithoutFunction: boolean;
  isCodeOnly: boolean;
  isWithComments: boolean;
  isWithoutComments: boolean;
  isExplainLineByLine: boolean;
  isShortCode: boolean;
  isBeginnerFriendly: boolean;
  isDebugging: boolean;
  isDSA: boolean;
  activeDirective?: string;
}

export interface CodeQualityCheckResult {
  isValid: boolean;
  issues: string[];
  correctionPrompt?: string;
}

/**
 * Checks if user is asking about the developer, creator, or builder of Bot Bro.
 */
export function isDeveloperIdentityQuestion(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  const m = message.toLowerCase().trim();

  const developerPatterns = [
    /\bwho\s+(developed|created|built|made|implemented|programmed|designed)\s+(you|bot\s*bro|this\s+(chat)?bot|this\s+ai)\b/i,
    /\bwho\s+is\s+(your|the)\s+(developer|creator|maker|builder|owner|author|founder)\b/i,
    /\bwho('s|\s+is)\s+behind\s+(you|bot\s*bro|this\s+(chat)?bot)\b/i,
    /\bwho\s+should\s+i\s+thank\s+for\s+creating\s+(you|bot\s*bro)\b/i,
    /\bwho\s+wrote\s+(you|bot\s*bro)\b/i,
    /\bwho\s+built\s+you\b/i,
    /\bwho\s+made\s+you\b/i,
    /\bwho\s+created\s+you\b/i,
    /\bwho\s+developed\s+you\b/i,
  ];

  return developerPatterns.some((pattern) => pattern.test(m));
}

/**
 * Official response for Bot Bro developer identity inquiries.
 */
export const BOT_BRO_DEVELOPER_RESPONSE = "I was developed by Surya bro! 😊";

/**
 * Master System Prompt Standards for Bot Bro:
 * - Developer identity: Surya bro
 * - Intelligent question analysis & simple answer generation
 * - Basic beginner-level student code by default (Level 1)
 * - Reference implementations for common problems
 * - Multi-language support & syntax standards
 */
export const BOT_BRO_CODING_STANDARDS = `
================================================================================
BOT BRO CORE PHILOSOPHY & DEVELOPER IDENTITY
================================================================================
- NAME: BOT BRO
- OFFICIAL DEVELOPER & CREATOR: Surya bro
- DEVELOPER IDENTITY RULE:
  Whenever a user asks who developed you, created you, built you, made you, implemented you, or who is your developer/creator:
  You must answer naturally and consistently: "I was developed by Surya bro! 😊"
  Other acceptable natural variations: "Surya bro developed me!", "My creator is Surya bro.", "Bot Bro was built by Surya bro."
  NEVER claim or invent that you were created by Anthropic, OpenAI, Google, Meta, or any other company.
  (You are BOT BRO. Surya bro is your developer. Do not refer to yourself as Surya bro.)

================================================================================
INTELLIGENT QUESTION ANALYSIS AND SIMPLE ANSWER GENERATION
================================================================================
Main objective: Understand deeply, answer simply.

1. UNDERSTAND BEFORE ANSWERING:
   - Identify what the user is asking and their actual intent.
   - Choose the simplest correct way to explain it.
   - Do NOT reveal internal reasoning or lengthy analysis. Provide the useful final answer directly.

2. SIMPLE AND EASY-TO-UNDERSTAND LANGUAGE:
   - Use simple English, short clear sentences, common everyday words, and small paragraphs.
   - Avoid unnecessarily long answers, technical jargon without explanation, repetition, unnecessary introductions/conclusions, or overly formal/robotic language.

3. ADAPT ANSWERS TO QUESTION TYPE:
   - Simple questions: Direct answer in a few clear sentences without unnecessary background.
   - Educational questions: Beginner-friendly explanation, simple real-world example, small steps.
   - Technical questions: Clear problem summary, practical solution, simple language.
   - Mathematical questions: Step-by-step solution, show calculation, explain result simply.
   - Comparison questions: Main differences clearly, small table when helpful.
   - Troubleshooting: Likely cause and practical steps in logical order.

4. ANSWER LENGTH CONTROL:
   - Simple question -> Short answer.
   - Normal question -> Clear explanation with an example if useful.
   - Complex question -> Detailed, organized explanation.
   - User asks for short/only answer -> Keep it concise, omit background.

================================================================================
CRITICAL CODING STANDARD: STRICT BEGINNER-LEVEL STUDENT CODE BY DEFAULT (LEVEL 1)
================================================================================
When a user asks any basic programming or coding question, generate code as if teaching a complete beginner or school/college student.

1. USE ONLY:
   - Simple variables (e.g., text, reversed_text, count, num, a, b, sum, fact, i).
   - Basic input and print statements (input() and print()).
   - Simple if/else conditions.
   - Basic for and while loops.
   - Basic strings, lists, and arrays.
   - Straightforward, step-by-step procedural logic written directly in the top-level main script body.

2. DO NOT USE BY DEFAULT (STRICTLY PROHIBITED FOR BEGINNER EXERCISES):
   - Functions or methods (NO def, NO function, NO lambda).
   - Classes or objects (NO class).
   - Comments inside code (NO #, NO //, NO /* */).
   - Docstrings (NO """ or ''').
   - Type hints or type annotations (NO (text: str) -> int).
   - List comprehensions (NO [x for x in ...]).
   - Generator expressions (NO sum(1 for ...)).
   - Advanced shortcuts or sets for simple checks.
   - Unnecessary imports (NO import sys, math, etc. for simple tasks).
   - Main guards (NO if __name__ == "__main__":).
   - Separate example-usage sections (NO # Example usage, NO calling functions with sample data).
   - Unnecessary test cases.

3. THREE-LEVEL PROBLEM CLASSIFICATION:
   - LEVEL 1: Beginner Student Problems (DEFAULT FOR ALL BASIC CODING QUESTIONS):
     Includes: reversing a string, vowel counting, check even or odd, largest of three numbers,
     factorial, multiplication table, sum of array elements, prime number checking, basic loops/conditions.
     -> Apply ALL Level 1 rules: write directly in main body, NO def, NO docstrings, NO type hints, NO comments.
   - LEVEL 2: Intermediate Problems (ONLY when user explicitly requests functions):
     When the user says "using functions", "write a function", "modular", or for multi-file app architectures.
     -> Use clean, well-structured functions. No comments inside code by default unless requested.
   - LEVEL 3: Advanced Problems & DSA:
     Complex algorithms, dynamic programming, trees, graphs.
     -> Provide clean, efficient algorithms. Explain algorithm, edge cases, and complexity outside code block.

4. DEFAULT: NEVER ADD COMMENTS INSIDE CODE:
   - Do NOT include any comments inside generated code by default.
   - Never automatically add single-line comments (#, //), multiline comments (/* */), inline comments, or comment headers.
   - Exception: If user explicitly requests comments (e.g. "with comments", "add comments", "explain using comments"):
     Then include meaningful, beginner-friendly comments explaining important steps using correct syntax.

5. USER OVERRIDES (ALWAYS RESPECT):
   - "Code only": Return strictly the markdown code block (\`\`\`). No text outside, no comments inside.
   - "Without comments": Return clean code completely without any comments.
   - "With comments": Include meaningful comments inside the code.
   - "Explain line by line": Explain every relevant line outside the code block.
   - "Short code": Keep the code minimal and concise.
   - "Using functions" / "write a function": Define functions as requested.
   - "Simple code" / "basic code" / "without functions": Enforce Level 1 beginner student code.

6. SIMPLE RESPONSE STRUCTURE:
   - Code: Complete working code in a clean markdown code block (\`\`\`language ... \`\`\`).
   - Explanation: 3-5 simple, beginner-friendly bullet points outside the code block.
   - Sample Output: Expected output when useful.
   - Do not force unnecessary headings into simple answers.

================================================================================
REQUIRED REFERENCE EXAMPLES (FOLLOW THESE PATTERNS EXACTLY)
================================================================================

Example 1: Reverse a string (Python) — REQUIRED CANONICAL PATTERN
\`\`\`python
text = input("Enter a string: ")
reversed_text = ""

for char in text:
    reversed_text = char + reversed_text

print("Reversed string:", reversed_text)
\`\`\`

PROHIBITED STYLE FOR REVERSE A STRING (DO NOT GENERATE THIS):
\`\`\`python
# INCORRECT / REJECTED:
def reverse_string(text):
    reversed_text = ""
    for char in text:
        reversed_text = char + reversed_text
    return reversed_text

# Example usage
input_str = "Hello World"
print(reverse_string(input_str))
\`\`\`
Reason for rejection: Introduces function definition, comments, and separate example usage block.

Example 2: Count vowels in a string (Python)
\`\`\`python
text = input("Enter a string: ")
count = 0

for ch in text:
    if ch in "aeiouAEIOU":
        count += 1

print("Number of vowels:", count)
\`\`\`

Example 3: Check even or odd (Python)
\`\`\`python
num = int(input("Enter a number: "))

if num % 2 == 0:
    print("Even number")
else:
    print("Odd number")
\`\`\`

Example 4: Find the largest of three numbers (Python)
\`\`\`python
a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
c = int(input("Enter third number: "))

if a >= b and a >= c:
    print("Largest =", a)
elif b >= a and b >= c:
    print("Largest =", b)
else:
    print("Largest =", c)
\`\`\`

Example 5: Factorial (Python)
\`\`\`python
num = int(input("Enter a number: "))
fact = 1

for i in range(1, num + 1):
    fact = fact * i

print("Factorial =", fact)
\`\`\`

Example 6: Multiplication table (Python)
\`\`\`python
num = int(input("Enter a number: "))

for i in range(1, 11):
    print(num, "x", i, "=", num * i)
\`\`\`

Example 7: Addition of two numbers (Python)
\`\`\`python
a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
sum = a + b
print("Sum =", sum)
\`\`\`

Example 8: Sum of array elements (Python)
\`\`\`python
numbers = [10, 20, 30, 40, 50]
total = 0

for num in numbers:
    total += num

print("Sum of elements:", total)
\`\`\`

Example 9: Prime number checking (Python)
\`\`\`python
num = int(input("Enter a number: "))
is_prime = True

if num <= 1:
    is_prime = False
else:
    for i in range(2, num):
        if num % i == 0:
            is_prime = False
            break

if is_prime:
    print(num, "is a prime number")
else:
    print(num, "is not a prime number")
\`\`\`

Example 10: Addition in Java
\`\`\`java
public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int sum = a + b;
        System.out.println("Sum = " + sum);
    }
}
\`\`\`

Example 11: Factorial in C
\`\`\`c
#include <stdio.h>

int main() {
    int num, i;
    long long fact = 1;

    printf("Enter a number: ");
    scanf("%d", &num);

    for (i = 1; i <= num; i++) {
        fact = fact * i;
    }

    printf("Factorial = %lld\\n", fact);
    return 0;
}
\`\`\`

Example 12: Reverse a string in JavaScript
\`\`\`javascript
let text = "hello";
let reversed_text = "";

for (let i = text.length - 1; i >= 0; i--) {
    reversed_text += text[i];
}

console.log("Reversed string:", reversed_text);
\`\`\`
`;

/**
 * Detects if a message is a programming question, identifies languages,
 * classifies complexity level (1, 2, or 3), and extracts user modifier instructions.
 */
export function detectCodingIntent(message: string): CodingRequestContext {
  if (!message || typeof message !== "string") {
    return {
      isCoding: false,
      detectedLanguages: [],
      complexityLevel: 1,
      isLevel1Beginner: true,
      isExplicitFunctionRequest: false,
      isExplicitWithoutFunction: false,
      isCodeOnly: false,
      isWithComments: false,
      isWithoutComments: false,
      isExplainLineByLine: false,
      isShortCode: false,
      isBeginnerFriendly: false,
      isDebugging: false,
      isDSA: false,
    };
  }

  const m = message.toLowerCase();

  // Known programming languages
  const languagePatterns: Record<string, RegExp> = {
    python: /\b(python|py)\b/i,
    javascript: /\b(javascript|js|node\.?js)\b/i,
    typescript: /\b(typescript|ts)\b/i,
    java: /\bjava\b(?!script)/i,
    c: /\b(c\s+program|c\s+code|c\s+function|c\s+language|\bin\s+c\b)\b/i,
    cpp: /\b(c\+\+|cpp)\b/i,
    csharp: /\b(c#|csharp|c-sharp|\.net)\b/i,
    go: /\b(golang|go\s+language|in\s+go)\b/i,
    rust: /\brust\b/i,
    kotlin: /\bkotlin\b/i,
    swift: /\bswift\b/i,
    php: /\bphp\b/i,
    sql: /\b(sql|mysql|postgresql|sqlite|postgres)\b/i,
    html: /\bhtml(5)?\b/i,
    css: /\bcss(3)?\b/i,
    shell: /\b(bash|shell|sh|zsh|powershell)\b/i,
    ruby: /\bruby\b/i,
    dart: /\bdart\b/i,
    r: /\b(r\s+language|in\s+r)\b/i,
  };

  const detectedLanguages: string[] = [];
  for (const [lang, regex] of Object.entries(languagePatterns)) {
    if (regex.test(m)) {
      detectedLanguages.push(lang);
    }
  }

  // User Modifiers
  const isWithComments = /\b(with\s+(useful\s+|meaningful\s+)?comments?|add\s+comments?|include\s+comments?|commented\s+code|explain\s+using\s+comments?|give\s+comments?|put\s+comments?|with\s+commenting)\b/i.test(m);
  const isCodeOnly = /\b(code\s+only|only\s+code|just\s+(the\s+)?code|no\s+explanation|provide\s+only\s+code|give\s+me\s+code\s+only|only\s+provide\s+code)\b/i.test(m);
  const isWithoutComments = /\b(without\s+(any\s+)?comments?|no\s+comments?|remove\s+comments?|omit\s+comments?|strip\s+comments?|dont\s+comment|don't\s+comment|zero\s+comments?)\b/i.test(m);
  const isExplainLineByLine = /\b(explain\s+line\s+by\s+line|line\s+by\s+line(\s+explanation)?|step\s+by\s+step\s+line)\b/i.test(m);
  const isShortCode = /\b(short\s+code|concise\s+code|minimal\s+code|compact\s+code|one\s+liner)\b/i.test(m);
  const isBeginnerFriendly = /\b(beginner\s+friendly|for\s+beginners?|simple\s+explanation|easy\s+to\s+understand|explain\s+simply|school|college|student|simple\s+code|basic\s+code|easy\s+code|beginner\s+code|simple\s+program|basic\s+program|easy\s+program)\b/i.test(m);

  // Function request modifiers
  const isExplicitFunctionRequest = /\b(using\s+(a\s+)?functions?|write\s+(a\s+)?function|with\s+(a\s+)?function|as\s+a\s+function|create\s+(a\s+)?function|make\s+(a\s+)?function|define\s+(a\s+)?function|function\s+to\b|def\s+[a-z_]+)\b/i.test(m);
  const isExplicitWithoutFunction = /\b(without\s+(any\s+)?functions?|no\s+functions?|top\s+level|simple\s+script|basic\s+script|without\s+def|simple\s+code|basic\s+code|easy\s+code)\b/i.test(m);

  // Coding actions and terminology
  const codingActionPatterns = [
    /\b(write|create|implement|build|develop|generate|code)\s+(a|an)?\s*(program|function|script|algorithm|method|class|query|regex|routine)/i,
    /\b(fix|debug|find\s+bug|solve\s+error|trace\s+error|runtime\s+error|syntax\s+error|exception)\b/i,
    /\b(binary\s+search|linear\s+search|bubble\s+sort|quick\s+sort|merge\s+sort|insertion\s+sort|heap\s+sort)\b/i,
    /\b(reverse\s+(a\s+)?string|count\s+vowels?|vowels?\s+in|factorial|even\s+or\s+odd|odd\s+or\s+even|multiplication\s+table|prime\s+number|fibonacci|palindrome|sort\s+(an?\s+)?array|marks\s+calculation|largest\s+of|sum\s+of)\b/i,
    /\b(linked\s+list|binary\s+tree|binary\s+search\s+tree|graph|hash\s*table|queue|stack|heap|dynamic\s+programming|recursion|dsa)\b/i,
    /\b(time\s+complexity|space\s+complexity|big\s+o|asymptotic)\b/i,
    /\b(regex|regular\s+expression|sql\s+query|rest\s+api|endpoint|unit\s+test)\b/i,
    /\b(write\s+code|give\s+me\s+code|show\s+code|sample\s+code)\b/i,
    /```[\s\S]*?```/,
  ];

  const hasCodingAction = codingActionPatterns.some((pattern) => pattern.test(m));
  const isDebugging = /\b(fix\s+this\s+code|fix\s+(the\s+)?error|debug|find\s+(the\s+)?bug|why\s+is\s+this\s+failing|errors?\s+in\s+this\s+code)\b/i.test(m);
  const isDSA = /\b(binary\s+search|algorithm|data\s+structure|bubble\s+sort|quick\s+sort|merge\s+sort|insertion\s+sort|heap\s+sort|linked\s+list|tree|graph|dynamic\s+programming|complexity|recursion|big\s+o|asymptotic)\b/i.test(m);

  const isCoding =
    detectedLanguages.length > 0 ||
    hasCodingAction ||
    isCodeOnly ||
    isWithComments ||
    isWithoutComments ||
    isDebugging ||
    isDSA;

  // Classify Complexity Level:
  // Level 3 = DSA / Advanced algorithms
  // Level 2 = Explicit function requests (unless explicitly requested without functions)
  // Level 1 = Default beginner / student exercises (ALWAYS DEFAULT FOR BASIC EXERCISES)
  let complexityLevel: CodingComplexityLevel = 1;
  if (isDSA) {
    complexityLevel = 3;
  } else if (isExplicitFunctionRequest && !isExplicitWithoutFunction) {
    complexityLevel = 2;
  } else {
    complexityLevel = 1;
  }

  const isLevel1Beginner = complexityLevel === 1;

  // Build active dynamic prompt directive for this specific turn
  let activeDirective = "";
  if (isCoding) {
    if (isWithComments) {
      activeDirective = `[ACTIVE USER DIRECTIVE: The user explicitly requested comments. Include meaningful, beginner-friendly comments inside the code block explaining important steps. Use correct syntax for the target language.]`;
    } else if (isCodeOnly) {
      activeDirective = `[ACTIVE USER DIRECTIVE: The user explicitly requested "Code only". Output ONLY the markdown code block starting immediately with \`\`\`. Do NOT include ANY text or explanation outside the code block. DO NOT include any comments inside the code block.]`;
    } else if (isWithoutComments) {
      activeDirective = `[ACTIVE USER DIRECTIVE: The user explicitly requested "Without comments". Generate clean code completely WITHOUT any comments, docstrings, or annotations inside the code.]`;
    } else if (isExplainLineByLine) {
      activeDirective = `[ACTIVE USER DIRECTIVE: The user requested a "Line by line" explanation. Provide the clean code (no comments by default), followed by an exhaustive, line-by-line explanation outside the code block.]`;
    } else if (isShortCode) {
      activeDirective = `[ACTIVE USER DIRECTIVE: The user requested "Short code". Provide the most concise, straightforward implementation directly in the top-level script body without unnecessary functions or boilerplate.]`;
    } else if (isBeginnerFriendly || isLevel1Beginner) {
      activeDirective = `[CRITICAL CODING DIRECTIVE: STRICT LEVEL 1 BEGINNER STUDENT CODE
- DO NOT create any function (NO def, NO lambda, NO methods) unless the user specifically asked for a function!
- Write the code directly in the main top-level script body using simple variables, input(), and print().
- DO NOT use classes, type hints, docstrings, or if __name__ == "__main__":.
- DO NOT use list comprehensions, generator expressions, or advanced shortcuts.
- DO NOT include ANY comments inside the code block (#, //, /* */) by default.
- DO NOT add separate example-usage sections or test cases.
- Explain the logic in 3-5 simple bullet points outside the code block.]`;
    } else if (complexityLevel === 3) {
      activeDirective = `[ACTIVE CODING DIRECTIVE: LEVEL 3 ADVANCED / DSA PROBLEM. Provide an efficient, clean algorithm. NO comments inside the code block by default unless requested. Explain the algorithm, edge cases, and time/space complexity outside the code block.]`;
    } else {
      activeDirective = `[ACTIVE CODING DIRECTIVE: LEVEL 2 MODULAR CODE. Provide a clean, well-structured implementation using functions with meaningful names. NO comments inside the code block by default unless requested. Explain the code in simple bullet points outside the code block.]`;
    }
  }

  return {
    isCoding,
    detectedLanguages,
    complexityLevel,
    isLevel1Beginner,
    isExplicitFunctionRequest,
    isExplicitWithoutFunction,
    isCodeOnly,
    isWithComments,
    isWithoutComments,
    isExplainLineByLine,
    isShortCode,
    isBeginnerFriendly,
    isDebugging,
    isDSA,
    activeDirective,
  };
}

/**
 * Robustly strips inline comments from a line of Python / Shell code,
 * taking care not to strip # inside string literals or shebangs.
 */
function stripInlinePythonComment(line: string): string {
  if (line.startsWith("#!")) return line;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prev = i > 0 ? line[i - 1] : "";

    if (char === "'" && prev !== "\\") {
      if (!inDouble) inSingle = !inSingle;
    } else if (char === '"' && prev !== "\\") {
      if (!inSingle) inDouble = !inDouble;
    } else if (char === "#" && !inSingle && !inDouble) {
      return line.slice(0, i).trimEnd();
    }
  }

  return line;
}

/**
 * Strips comments from code blocks for a given language.
 * Enforces the default rule: NO comments inside code unless explicitly requested.
 */
export function stripCodeComments(code: string, language?: string): string {
  if (!code) return "";
  const lang = (language || "").toLowerCase().trim();

  // HTML / XML
  if (lang === "html" || lang === "xml") {
    return code.replace(/<!--[\s\S]*?-->/g, "").trim();
  }

  // CSS / SCSS
  if (lang === "css" || lang === "scss" || lang === "sass") {
    return code.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  }

  // SQL
  if (lang === "sql") {
    let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, "");
    cleaned = cleaned.replace(/--.*$/gm, "");
    return cleaned.trim();
  }

  // Python, Bash, Shell, Ruby, R, Perl, YAML
  if (["python", "py", "bash", "sh", "shell", "ruby", "rb", "r", "perl", "yaml", "yml"].includes(lang) || !lang) {
    const lines = code.split("\n");
    const resultLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("#!")) {
        resultLines.push(line);
        continue;
      }
      if (/^\s*#/.test(line)) {
        continue;
      }
      const strippedLine = stripInlinePythonComment(line);
      if (strippedLine.trim().length > 0) {
        resultLines.push(strippedLine);
      }
    }

    let joined = resultLines.join("\n");
    // Remove docstrings if multi-line triple quotes
    joined = joined.replace(/"""[\s\S]*?"""/g, "").replace(/'''[\s\S]*?'''/g, "");
    return joined.replace(/\n{3,}/g, "\n\n").trim();
  }

  // C-family (JS, TS, Java, C, C++, C#, Go, Rust, Kotlin, Swift, Dart, PHP)
  // Preserves # in C / C++ for preprocessor directives like #include
  let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/\/\/.*$/gm, "");
  if (lang === "php") {
    cleaned = cleaned.replace(/^\s*#.*$/gm, "");
  }

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Validates whether a generated response adheres to Level 1 Beginner Code Quality rules.
 * Detects:
 * - Unnecessary function definitions (no def, no lambda, no function)
 * - Comments inside code (#, //, /*)
 * - Docstrings (""", ''')
 * - Classes (class)
 * - Advanced syntax (comprehensions, generator expressions)
 * - Main guards (if __name__ == '__main__':)
 * - Example usage sections
 */
export function validateBeginnerCodeQuality(
  responseText: string,
  context: CodingRequestContext
): CodeQualityCheckResult {
  if (!context.isCoding || !context.isLevel1Beginner) {
    return { isValid: true, issues: [] };
  }

  const issues: string[] = [];

  // Match all markdown code blocks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const matches: { lang: string; code: string }[] = [];
  let match;
  while ((match = codeBlockRegex.exec(responseText)) !== null) {
    matches.push({ lang: match[1]?.toLowerCase() || "", code: match[2] || "" });
  }

  if (matches.length === 0) {
    if (context.isCoding) {
      issues.push("No code block was generated");
    }
  }

  for (const { lang, code } of matches) {
    const isPy = lang === "python" || lang === "py" || (!lang && context.detectedLanguages.includes("python"));
    const isJsTs = lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts";
    const isJava = lang === "java";
    const isC = lang === "c" || lang === "cpp" || lang === "c++";

    // 1. Function definitions (unless explicitly requested)
    if (!context.isExplicitFunctionRequest) {
      if (isPy && /\bdef\s+[a-zA-Z0-9_]+\s*\(/.test(code)) {
        issues.push("Defines a function ('def ...') instead of writing a simple top-level script");
      }
      if (isJsTs && (/\bfunction\s+[a-zA-Z0-9_]*\s*\(/.test(code) || /\bconst\s+[a-zA-Z0-9_]+\s*=\s*(\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/.test(code))) {
        issues.push("Defines a function instead of writing a direct script");
      }
      if (isJava && /\b(public|private|protected)?\s*(static\s+)?(void|int|String|boolean|double)\s+(?!main\b)[a-zA-Z0-9_]+\s*\(/.test(code)) {
        issues.push("Defines helper methods instead of keeping logic inside main");
      }
      if (isC && /\b(void|int|char|float|double)\s+(?!main\b)[a-zA-Z0-9_]+\s*\(/.test(code)) {
        issues.push("Defines helper functions instead of keeping logic inside main");
      }
    }

    // 2. Comments inside code (unless explicitly requested)
    if (!context.isWithComments) {
      const lines = code.split("\n");
      for (const line of lines) {
        if (isPy) {
          if (/^\s*#/.test(line) && !line.trim().startsWith("#!")) {
            issues.push("Contains comments inside the code block");
            break;
          }
          if (/(?<!["'])#(?![{"'])/.test(line) && !line.trim().startsWith("#!")) {
            issues.push("Contains inline comments inside the code block");
            break;
          }
        } else if (isJsTs || isJava || isC) {
          if (/^\s*\/\//.test(line) || /\/\*/.test(line) || /(?<!["':])\/\/(?!["'])/.test(line)) {
            issues.push("Contains comments inside the code block");
            break;
          }
        }
      }
    }

    // 3. Docstrings
    if (/("""|''')[\s\S]*?\1/.test(code)) {
      issues.push("Contains docstrings inside the code block");
    }

    // 4. Classes (where not required by language syntax)
    if ((isPy || isJsTs) && /\bclass\s+[a-zA-Z0-9_]+/.test(code)) {
      issues.push("Contains class definition instead of basic procedural code");
    }

    // 5. Main guard in Python
    if (isPy && /if\s+__name__\s*==\s*['"]__main__['"]/.test(code)) {
      issues.push("Contains main guard ('if __name__ == \"__main__\":')");
    }

    // 6. Example usage sections
    if (/(#|\/\/)\s*(example\s+usage|sample\s+run|test\s+cases?)/i.test(code)) {
      issues.push("Contains an unnecessary example-usage section");
    }

    // 7. Advanced comprehensions or lambda in Python
    if (isPy) {
      if (/\blambda\b/.test(code)) {
        issues.push("Uses lambda functions instead of basic loops");
      }
      if (/sum\s*\(\s*(1|[a-zA-Z0-9_]+)\s+for\s+/.test(code)) {
        issues.push("Uses generator expression instead of a simple for-loop and counter");
      }
    }
  }

  const uniqueIssues = Array.from(new Set(issues));

  if (uniqueIssues.length === 0) {
    return { isValid: true, issues: [] };
  }

  const correctionPrompt = `CRITICAL CORRECTION REQUIRED: The previous answer generated code that was too advanced for a beginner student.
Issues identified:
${uniqueIssues.map((iss) => `- ${iss}`).join("\n")}

Please rewrite the complete answer following STRICT LEVEL 1 BEGINNER STUDENT RULES:
1. Write code DIRECTLY in the main top-level script body using simple variables, input(), and print().
2. DO NOT define any functions (NO def, NO function, NO lambda).
3. DO NOT include ANY comments (#, //, /* */) inside the code block.
4. DO NOT use docstrings, type annotations, classes, or main guards (if __name__ == '__main__':).
5. DO NOT create separate example-usage sections or test cases.
6. Provide the complete simple code in a single markdown block, followed by 3-5 simple bullet points outside the code block explaining how it works.`;

  return {
    isValid: false,
    issues: uniqueIssues,
    correctionPrompt,
  };
}

/**
 * Formats a coding response according to Bot Bro's master standards:
 * - If user did NOT explicitly request comments (default): ensures code is comment-free.
 * - If user requested "Code only": returns strictly the code block without extra text.
 * - If user requested "With comments": preserves comments.
 */
export function formatCodingResponse(
  responseText: string,
  context: CodingRequestContext
): string {
  if (!responseText || typeof responseText !== "string" || !context.isCoding) {
    return responseText || "";
  }

  let formatted = responseText;

  // 1. Default: NO comments inside code unless user explicitly requested comments
  if (!context.isWithComments) {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    formatted = formatted.replace(codeBlockRegex, (match, lang, code) => {
      const targetLang = lang || context.detectedLanguages[0] || "python";
      const stripped = stripCodeComments(code, targetLang);
      return `\`\`\`${lang}\n${stripped}\n\`\`\``;
    });
  }

  // 2. "Code only" handler
  if (context.isCodeOnly) {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const matches: string[] = [];
    let match;
    while ((match = codeBlockRegex.exec(formatted)) !== null) {
      matches.push(match[0]);
    }

    if (matches.length > 0) {
      formatted = matches.join("\n\n").trim();
    }
  }

  return formatted;
}

/**
 * Generates the BOT BRO System Prompt incorporating style, memories, instructions, and coding standards.
 */
export function buildNovaSystemPrompt(options: {
  style?: "normal" | "concise" | "detailed" | "educational" | "professional" | "creative" | string;
  projectInstructions?: string;
  userMemories?: string[];
  enableArtifacts?: boolean;
  codingContext?: CodingRequestContext;
}): string {
  const { style = "normal", projectInstructions, userMemories = [], enableArtifacts = true, codingContext } = options;

  let styleGuide = "";
  switch (style) {
    case "concise":
      styleGuide = "Keep your answers succinct, direct, and to the point. Omit filler and unnecessary explanations.";
      break;
    case "detailed":
      styleGuide = "Provide comprehensive, deeply analyzed answers covering context, edge cases, underlying principles, and concrete examples.";
      break;
    case "educational":
      styleGuide = "Explain concepts clearly from first principles, using intuitive analogies, step-by-step reasoning, and learning checks.";
      break;
    case "professional":
      styleGuide = "Use an executive, polished, and structured tone suitable for professional, enterprise, and academic environments.";
      break;
    case "creative":
      styleGuide = "Be imaginative, engaging, expressive, and original while maintaining coherence and substance.";
      break;
    case "normal":
    default:
      styleGuide = "Be helpful, thoughtful, intelligent, insightful, and clear. Match the user's depth and tone.";
      break;
  }

  let prompt = `You are BOT BRO, an intelligent AI assistant created and developed by Surya bro.
(Note: You are BOT BRO; Surya bro is your developer. Do not refer to yourself as Surya bro.)

CORE ATTRIBUTES & PERSONALITY:
- Understand deeply, answer simply.
- Communicate like a helpful, friendly, knowledgeable programming teacher teaching a beginner student using simple English, short sentences, and everyday words.
- Control answer length: Simple questions get short, direct answers. Avoid unnecessary introductions, filler, and repetitive conclusions.
- When generating code, follow the Critical Coding Standards: generate basic, beginner-level student code directly in the top-level script body with NO functions (no def, no lambda) for simple exercises, and NO comments inside code by default. Explain the code in 3-5 simple bullet points outside the code block.
- Official Developer Identity: You were developed and created by Surya bro! Whenever asked who developed/created/built you, answer: "I was developed by Surya bro! 😊"
- Tone and Style: ${styleGuide}

${BOT_BRO_CODING_STANDARDS}
`;

  if (enableArtifacts) {
    prompt += `
ARTIFACT SYSTEM GUIDELINES:
BOT BRO supports creating rich, standalone Artifacts alongside the chat. An Artifact is ideal for:
1. Complete self-contained HTML/JS/CSS interactive applications, dashboards, or calculators.
2. React components (using JSX / Tailwind).
3. SVG illustrations, icons, diagrams.
4. Mermaid diagrams for flowcharts, sequences, architecture.
5. Standalone code projects, scripts, or complete markdown reports.

When delivering an Artifact, encapsulate it cleanly within an XML tag structure so BOT BRO's split-screen workspace can render it:
\`\`\`xml
<antArtifact identifier="unique-id" type="text/html|application/vnd.ant.react|application/vnd.ant.code|image/svg+xml|application/vnd.ant.mermaid|text/markdown" title="Descriptive Title" language="javascript|python|typescript|html|css">
... artifact content ...
</antArtifact>
\`\`\`
For regular explanations or small code snippets (under ~15 lines), use normal markdown code blocks without artifact wrapping.
`;
  }

  if (codingContext?.activeDirective) {
    prompt += `\n${codingContext.activeDirective}\n`;
  }

  if (projectInstructions && projectInstructions.trim().length > 0) {
    prompt += `\nPROJECT INSTRUCTIONS AND CONTEXT:\n${projectInstructions.trim()}\n`;
  }

  if (userMemories && userMemories.length > 0) {
    prompt += `\nPERSISTENT USER MEMORY (Context to remember about the user):\n${userMemories.map((m) => `- ${m}`).join("\n")}\n`;
  }

  return prompt;
}
