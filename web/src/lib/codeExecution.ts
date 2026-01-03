// Piston API - Free code execution engine
// Docs: https://github.com/engineer-man/piston

const PISTON_API = 'https://emkc.org/api/v2/piston/execute'

interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  runtime?: string
}

interface PistonResponse {
  run: {
    stdout: string
    stderr: string
    code: number
    signal: string | null
    output: string
  }
  compile?: {
    stdout: string
    stderr: string
    code: number
  }
}

export async function executeCode(
  code: string,
  language: 'python' | 'javascript',
  testInput?: string
): Promise<ExecutionResult> {
  const languageMap = {
    python: { language: 'python', version: '3.10' },
    javascript: { language: 'javascript', version: '18.15' },
  }

  const config = languageMap[language]

  // Wrap code with test input if provided
  let finalCode = code
  if (testInput) {
    if (language === 'python') {
      // For Python, we'll inject the test case and call the function
      finalCode = `${code}\n\n# Test execution\nimport json\ntest_input = ${testInput}\nif isinstance(test_input, dict):\n    result = list(globals().values())[-2](**test_input)\nelse:\n    result = list(globals().values())[-2](test_input)\nprint(json.dumps(result))`
    } else {
      // For JavaScript
      finalCode = `${code}\n\n// Test execution\nconst testInput = ${testInput};\nconst funcs = Object.keys(this).filter(k => typeof this[k] === 'function');\nconst lastFunc = funcs[funcs.length - 1];\nlet result;\nif (typeof testInput === 'object' && !Array.isArray(testInput)) {\n  result = this[lastFunc](...Object.values(testInput));\n} else {\n  result = this[lastFunc](testInput);\n}\nconsole.log(JSON.stringify(result));`
    }
  }

  try {
    const startTime = performance.now()
    
    const response = await fetch(PISTON_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [{ content: finalCode }],
      }),
    })

    const endTime = performance.now()
    const runtime = `${Math.round(endTime - startTime)}ms`

    if (!response.ok) {
      return {
        success: false,
        output: '',
        error: `API Error: ${response.status} ${response.statusText}`,
      }
    }

    const data: PistonResponse = await response.json()

    // Check for compilation errors
    if (data.compile && data.compile.code !== 0) {
      return {
        success: false,
        output: '',
        error: data.compile.stderr || data.compile.stdout,
        runtime,
      }
    }

    // Check for runtime errors
    if (data.run.code !== 0 || data.run.stderr) {
      return {
        success: false,
        output: data.run.stdout,
        error: data.run.stderr || `Exit code: ${data.run.code}`,
        runtime,
      }
    }

    return {
      success: true,
      output: data.run.stdout.trim(),
      runtime,
    }
  } catch (err) {
    return {
      success: false,
      output: '',
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

// Extract function name from code (finds first def/function declaration)
function extractFunctionName(code: string, language: 'python' | 'javascript'): string | null {
  if (language === 'python') {
    const match = code.match(/def\s+(\w+)\s*\(/)
    return match ? match[1] : null
  } else {
    const match = code.match(/function\s+(\w+)\s*\(/)
    return match ? match[1] : null
  }
}

// Run code against a single test case
export async function runTestCase(
  code: string,
  language: 'python' | 'javascript',
  input: any,
  expected: any
): Promise<{
  passed: boolean
  input: string
  expected: string
  actual: string
  error?: string
  runtime?: string
}> {
  const inputStr = JSON.stringify(input)
  const expectedStr = JSON.stringify(expected)
  
  // Get the function name from the code
  const funcName = extractFunctionName(code, language)
  if (!funcName) {
    return {
      passed: false,
      input: inputStr,
      expected: expectedStr,
      actual: 'ERROR: Could not find function definition',
      error: 'No function definition found in code',
    }
  }

  // Build wrapper code that calls the function with test input
  let wrappedCode: string
  
  if (language === 'python') {
    // For Python, call function with unpacked dict args
    wrappedCode = `${code}

# --- Test Runner ---
import json

test_input = ${inputStr}

# Call the function
if isinstance(test_input, dict):
    result = ${funcName}(**test_input)
elif isinstance(test_input, list):
    result = ${funcName}(*test_input)
else:
    result = ${funcName}(test_input)

print(json.dumps(result))
`
  } else {
    // For JavaScript
    const escapedInput = inputStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    wrappedCode = `${code}

// --- Test Runner ---
const testInput = JSON.parse('${escapedInput}');

let result;
if (typeof testInput === 'object' && testInput !== null && !Array.isArray(testInput)) {
  result = ${funcName}(...Object.values(testInput));
} else if (Array.isArray(testInput)) {
  result = ${funcName}(...testInput);
} else {
  result = ${funcName}(testInput);
}

console.log(JSON.stringify(result));
`
  }

  const result = await executeCode(wrappedCode, language)

  if (!result.success) {
    return {
      passed: false,
      input: inputStr,
      expected: expectedStr,
      actual: result.error || 'Execution failed',
      error: result.error,
      runtime: result.runtime,
    }
  }

  // Parse and compare results
  let actualValue: any
  try {
    actualValue = JSON.parse(result.output)
  } catch {
    actualValue = result.output
  }

  // Deep comparison
  const passed = JSON.stringify(actualValue) === expectedStr

  return {
    passed,
    input: inputStr,
    expected: expectedStr,
    actual: JSON.stringify(actualValue),
    runtime: result.runtime,
  }
}

// Run all test cases for a problem
export async function runAllTests(
  code: string,
  language: 'python' | 'javascript',
  testCases: { input: any; expected: any }[]
): Promise<{
  score: number
  passed: number
  total: number
  results: {
    passed: boolean
    input: string
    expected: string
    actual: string
    error?: string
    runtime?: string
  }[]
  totalRuntime: string
}> {
  const startTime = performance.now()
  const results = []
  let passed = 0

  for (const testCase of testCases) {
    const result = await runTestCase(code, language, testCase.input, testCase.expected)
    results.push(result)
    if (result.passed) passed++
  }

  const endTime = performance.now()
  const totalRuntime = `${Math.round(endTime - startTime)}ms`

  return {
    score: Math.round((passed / testCases.length) * 100),
    passed,
    total: testCases.length,
    results,
    totalRuntime,
  }
}

