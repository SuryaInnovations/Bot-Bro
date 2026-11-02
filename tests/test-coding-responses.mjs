/**
 * BOT BRO — Comprehensive Master Test Suite for Strict Beginner Mode
 *
 * Verifies across ALL THREE AI Providers (Gemini, Groq, OpenRouter):
 * 1. Write a program to reverse a string.
 * 2. Write a program to count vowels.
 * 3. Write a program to check even or odd.
 * 4. Write a program to find the largest of three numbers.
 * 5. Write a program to calculate factorial.
 * 6. Write a program to print a multiplication table.
 *
 * PLUS:
 * 7. Response Quality Check & Automatic Correction Loop verification
 * 8. User Overrides ("with comments", "code only", "write a function")
 * 9. Developer Identity Verification (Surya bro)
 */

import { readFileSync } from 'fs';
import {
  detectCodingIntent,
  stripCodeComments,
  formatCodingResponse,
  isDeveloperIdentityQuestion,
  BOT_BRO_DEVELOPER_RESPONSE,
  BOT_BRO_CODING_STANDARDS,
  buildNovaSystemPrompt,
  validateBeginnerCodeQuality,
} from '../src/lib/coding/coding-prompt.ts';

// Load environment variables from .env.local
let env = {};
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  env = Object.fromEntries(
    envContent
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
} catch (e) {
  console.warn('Warning: .env.local not found or unreadable');
}

const SIX_CORE_QUESTIONS = [
  { id: 1, prompt: 'Write a Python program to reverse a string.', name: 'Reverse String' },
  { id: 2, prompt: 'Write a Python program to count vowels in a string.', name: 'Count Vowels' },
  { id: 3, prompt: 'Write a Python program to check even or odd.', name: 'Even or Odd' },
  { id: 4, prompt: 'Write a Python program to find the largest of three numbers.', name: 'Largest of Three' },
  { id: 5, prompt: 'Write a Python program to calculate factorial.', name: 'Factorial' },
  { id: 6, prompt: 'Write a Python program to print a multiplication table.', name: 'Multiplication Table' },
];

const DEVELOPER_IDENTITY_TESTS = [
  'Who developed you?',
  'Who created Bot Bro?',
  'Who implemented this chatbot?',
  'Who is your developer?',
  'Who built you?',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callProvider(provider, systemPrompt, userPrompt, messagesHistory = []) {
  const msgs = [...messagesHistory];
  if (msgs.length === 0) {
    msgs.push({ role: 'user', content: userPrompt });
  }

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      if (provider === 'groq' && env.GROQ_API_KEY) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + env.GROQ_API_KEY,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: systemPrompt },
              ...msgs,
            ],
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (res.status === 429) {
          const waitHeader = res.headers.get('retry-after');
          const waitTime = waitHeader ? parseInt(waitHeader, 10) * 1000 : 3000;
          await sleep(Math.max(waitTime, 3000));
          continue;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) return content;
        if (data?.error?.message) {
          console.warn(`    Groq message: ${data.error.message}`);
        }
      }

      if (provider === 'gemini' && env.GEMINI_API_KEY) {
        const url =
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=' +
          env.GEMINI_API_KEY;

        const contents = msgs.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.1 },
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (res.status === 429) {
          await sleep(3000);
          continue;
        }

        const data = await res.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) return content;
      }

      if (provider === 'openrouter' && env.OPENROUTER_API_KEY) {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + env.OPENROUTER_API_KEY,
          },
          body: JSON.stringify({
            model: 'liquid/lfm-2.5-2.6b:free',
            messages: [
              { role: 'system', content: systemPrompt },
              ...msgs,
            ],
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (res.status === 429) {
          await sleep(3500);
          continue;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(2500);
    }
  }

  return null;
}

function checkCodeForComments(codeContent, lang = 'python') {
  const isPython = lang === 'python';
  const lines = codeContent.split('\n');

  if (isPython) {
    for (const line of lines) {
      if (/^\s*#/.test(line) && !line.trim().startsWith('#!')) return true;
      if (/(?<!["'])#(?![{"'])/.test(line) && !line.trim().startsWith('#!')) return true;
    }
  } else {
    for (const line of lines) {
      if (/^\s*\/\//.test(line)) return true;
      if (/\/\*/.test(line)) return true;
      if (/(?<!["':])\/\/(?!["'])/.test(line)) return true;
    }
  }
  return false;
}

/**
 * End-to-end execution helper replicating route.ts behavior:
 * Injects beginner directive into user message, generates response,
 * performs quality check, and triggers correction loop if needed.
 */
async function generateAndVerifyBeginnerCode(provider, userPrompt) {
  const codingContext = detectCodingIntent(userPrompt);
  const systemPrompt = buildNovaSystemPrompt({ style: 'normal', codingContext });

  // Attach beginner instruction directly to message payload as done in route.ts
  const messageWithInstruction = `${userPrompt}\n\n[MANDATORY INSTRUCTION: Write basic beginner school student code. Use only simple variables, input(), print(), simple loops and conditions. DO NOT use functions (no def, no function), NO classes, NO comments (#, //), NO docstrings, NO main guards, NO example usage sections. Provide 3-5 simple bullet points explanation outside the code block.]`;

  let responseText = await callProvider(provider, systemPrompt, messageWithInstruction);
  if (!responseText) {
    throw new Error(`Provider ${provider} returned empty response.`);
  }

  // Response Quality Check
  const quality = validateBeginnerCodeQuality(responseText, codingContext);
  let wasCorrected = false;

  if (!quality.isValid && quality.correctionPrompt) {
    console.log(`    ⚠️  Quality check flagged issues for ${provider}: ${quality.issues.join(', ')}`);
    console.log(`    🔄  Executing automatic correction loop...`);
    await sleep(1500);
    const correctedText = await callProvider(provider, systemPrompt, '', [
      { role: 'user', content: messageWithInstruction },
      { role: 'assistant', content: responseText },
      { role: 'user', content: quality.correctionPrompt },
    ]);
    if (correctedText) {
      responseText = correctedText;
      wasCorrected = true;
    }
  }

  const formatted = formatCodingResponse(responseText, codingContext);
  return { formatted, wasCorrected, rawQuality: quality };
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🤖 BOT BRO STRICT BEGINNER MODE — MASTER MULTI-PROVIDER TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------------------
  // 1. UNIT TEST: Response Quality Check & Automatic Flagging Logic
  // -------------------------------------------------------------------------
  console.log('--- Step 1: Response Quality Check Engine (Unit Tests) ---');
  const badPythonCode = `Here is the code:
\`\`\`python
def reverse_string(text: str) -> str:
    """Return the reversed string."""
    reversed_text = ""
    for char in text:
        reversed_text = char + reversed_text
    return reversed_text

# Example usage
input_str = "Hello World"
print(reverse_string(input_str))
\`\`\`
Explanation: This reverses a string.`;

  const dummyContext = detectCodingIntent('Write a Python program to reverse a string.');
  const badQuality = validateBeginnerCodeQuality(badPythonCode, dummyContext);

  if (
    !badQuality.isValid &&
    badQuality.issues.some((i) => i.includes('def')) &&
    badQuality.issues.some((i) => i.includes('comment')) &&
    badQuality.issues.some((i) => i.includes('docstring')) &&
    badQuality.correctionPrompt
  ) {
    console.log('  ✓ Response quality check accurately detected def, comments, docstring, example usage');
    console.log('    Issues detected:', badQuality.issues.join('; '));
    passed++;
  } else {
    console.error('  ✗ Response quality check failed to detect violations:', badQuality);
    failed++;
  }

  const goodPythonCode = `\`\`\`python
text = input("Enter a string: ")
reversed_text = ""

for char in text:
    reversed_text = char + reversed_text

print("Reversed string:", reversed_text)
\`\`\`

* We take input string from user.
* We loop through each character and prepend it to reversed_text.
* Finally we print the reversed string.`;

  const goodQuality = validateBeginnerCodeQuality(goodPythonCode, dummyContext);
  if (goodQuality.isValid && goodQuality.issues.length === 0) {
    console.log('  ✓ Response quality check correctly passed clean beginner code');
    passed++;
  } else {
    console.error('  ✗ Response quality check incorrectly flagged clean code:', goodQuality);
    failed++;
  }

  // -------------------------------------------------------------------------
  // 2. LIVE TESTS: All 6 Core Questions Across GEMINI, GROQ, & OPENROUTER
  // -------------------------------------------------------------------------
  console.log('\n--- Step 2: Testing All 6 Core Questions Across Every Provider ---');
  const providersToTest = ['gemini', 'groq', 'openrouter'];

  for (const provider of providersToTest) {
    console.log(`\n========================================================`);
    console.log(`🌐 TESTING PROVIDER: ${provider.toUpperCase()}`);
    console.log(`========================================================`);

    for (const q of SIX_CORE_QUESTIONS) {
      console.log(`\n[${provider.toUpperCase()} - Q${q.id}]: "${q.prompt}"`);

      try {
        await sleep(1500); // Rate pacing between requests
        const { formatted, wasCorrected } = await generateAndVerifyBeginnerCode(provider, q.prompt);

        const codeBlockMatch = formatted.match(/```(?:[a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
        const codeContent = codeBlockMatch ? codeBlockMatch[1] : '';

        const hasDef = /\bdef\s+[a-zA-Z0-9_]+\s*\(/.test(codeContent);
        const hasComments = checkCodeForComments(codeContent, 'python');
        const hasDocstring = /("""|''')/.test(codeContent);
        const hasClass = /\bclass\s+[a-zA-Z0-9_]+/.test(codeContent);
        const hasMainGuard = /if\s+__name__\s*==\s*['"]__main__['"]/.test(codeContent);
        const textOutside = formatted.replace(/```[\s\S]*?```/g, '').trim();
        const hasExplanationOutside = textOutside.length > 15;

        let testOk = true;
        const issues = [];

        if (!codeBlockMatch) {
          testOk = false;
          issues.push('No code block generated');
        }
        if (hasDef) {
          testOk = false;
          issues.push('Code contains function definition (def)');
        }
        if (hasComments) {
          testOk = false;
          issues.push('Code contains comments (#)');
        }
        if (hasDocstring) {
          testOk = false;
          issues.push('Code contains docstrings');
        }
        if (hasClass) {
          testOk = false;
          issues.push('Code contains classes');
        }
        if (hasMainGuard) {
          testOk = false;
          issues.push('Code contains if __name__ == "__main__":');
        }
        if (!hasExplanationOutside) {
          testOk = false;
          issues.push('Explanation outside code block is missing');
        }

        if (testOk) {
          console.log(`  ✓ PASSED: ${q.name} on ${provider} (corrected: ${wasCorrected ? 'Yes' : 'No - passed naturally'})`);
          console.log(`    Generated Code:\n${codeContent.trim()}`);
          passed++;
        } else {
          console.error(`  ✗ FAILED: ${q.name} on ${provider}:`, issues.join('; '));
          console.log(`    Code:\n${codeContent}`);
          failed++;
        }
      } catch (err) {
        console.error(`  ✗ ERROR on ${provider} Q${q.id}:`, err?.message || err);
        failed++;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. LIVE TESTS: User Overrides (With Comments, Code Only, Write a Function)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 3: User Override Tests ---');

  // Override A: Explicit function request
  console.log('\n[Override 1]: "Write a Python function to calculate factorial."');
  await sleep(1500);
  const funcContext = detectCodingIntent('Write a Python function to calculate factorial.');
  const funcSys = buildNovaSystemPrompt({ style: 'normal', codingContext: funcContext });
  const funcRes = await callProvider('gemini', funcSys, 'Write a Python function to calculate factorial.');
  const funcFormatted = formatCodingResponse(funcRes, funcContext);
  const funcCodeMatch = funcFormatted.match(/```(?:[a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
  const funcCode = funcCodeMatch ? funcCodeMatch[1] : '';

  if (funcCode.includes('def ')) {
    console.log('  ✓ Explicit function request PASSED: function generated as requested');
    passed++;
  } else {
    console.error('  ✗ Explicit function request FAILED: no function generated');
    failed++;
  }

  // Override B: Explicit comment request
  console.log('\n[Override 2]: "Write a Python program to add two numbers with comments."');
  await sleep(1500);
  const comContext = detectCodingIntent('Write a Python program to add two numbers with comments.');
  const comSys = buildNovaSystemPrompt({ style: 'normal', codingContext: comContext });
  const comRes = await callProvider('gemini', comSys, 'Write a Python program to add two numbers with comments.');
  const comFormatted = formatCodingResponse(comRes, comContext);
  const comCodeMatch = comFormatted.match(/```(?:[a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
  const comCode = comCodeMatch ? comCodeMatch[1] : '';

  if (comCode.includes('#')) {
    console.log('  ✓ Explicit comment request PASSED: comments preserved as requested');
    passed++;
  } else {
    console.error('  ✗ Explicit comment request FAILED: comments were stripped despite request');
    failed++;
  }

  // Override C: Code only request
  console.log('\n[Override 3]: "Give me code only for reverse string in Python."');
  await sleep(1500);
  const codeOnlyContext = detectCodingIntent('Give me code only for reverse string in Python.');
  const codeOnlySys = buildNovaSystemPrompt({ style: 'normal', codingContext: codeOnlyContext });
  const codeOnlyRes = await callProvider('gemini', codeOnlySys, 'Give me code only for reverse string in Python.');
  const codeOnlyFormatted = formatCodingResponse(codeOnlyRes, codeOnlyContext).trim();
  const isStrictCode = codeOnlyFormatted.startsWith('```') && codeOnlyFormatted.endsWith('```');

  if (isStrictCode && !codeOnlyFormatted.includes('#') && !codeOnlyFormatted.includes('def ')) {
    console.log('  ✓ Code only request PASSED: strict code block only, zero comments, zero functions');
    passed++;
  } else {
    console.error('  ✗ Code only request FAILED:', codeOnlyFormatted);
    failed++;
  }

  // -------------------------------------------------------------------------
  // 4. LIVE TESTS: Developer Identity (Surya bro)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 4: Developer Identity Verification ---');
  for (const q of DEVELOPER_IDENTITY_TESTS) {
    await sleep(1000);
    const sysPrompt = buildNovaSystemPrompt({ style: 'normal' });
    const res = await callProvider('gemini', sysPrompt, q);
    const mentionsSurya = /surya\s*bro/i.test(res);

    if (mentionsSurya) {
      console.log(`  ✓ "${q}" -> Surya bro recognized`);
      passed++;
    } else {
      console.error(`  ✗ "${q}" -> FAILED to identify Surya bro:`, res);
      failed++;
    }
  }

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
