/**
 * Authentication Flow Testing Script
 * Tests all authentication methods and verifies session management
 */

const http = require("http");
const https = require("https");

const BASE_URL = "http://localhost:3001";

// Test credentials
const TEST_USERS = {
  admin: {
    email: "admin@csir.co.za",
    password: "password123",
    expectedRole: "ADMIN",
  },
  projectLead: {
    email: "sarah.johnson@csir.co.za",
    password: "password123",
    expectedRole: "PROJECT_LEAD",
  },
  researcher: {
    email: "linda.williams@csir.co.za",
    password: "password123",
    expectedRole: "RESEARCHER",
  },
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
      ...options,
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers["set-cookie"] || [],
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logTest(name, passed, message) {
  const status = passed ? "✅" : "❌";
  console.log(`${status} ${name}`);
  if (message) console.log(`   ${message}`);

  if (passed) {
    results.passed.push(name);
  } else {
    results.failed.push({ name, message });
  }
}

function logWarning(name, message) {
  console.log(`⚠️  ${name}`);
  console.log(`   ${message}`);
  results.warnings.push({ name, message });
}

async function testServerRunning() {
  console.log("\n📡 Testing Server Availability...\n");

  try {
    const response = await makeRequest(BASE_URL);
    logTest(
      "Server is running",
      response.statusCode === 200 || response.statusCode === 307,
      `Status: ${response.statusCode}`
    );
    return true;
  } catch (error) {
    logTest("Server is running", false, `Error: ${error.message}`);
    return false;
  }
}

async function testLoginPageAccess() {
  console.log("\n🔐 Testing Login Page Access...\n");

  try {
    const response = await makeRequest(`${BASE_URL}/auth/login`);
    logTest(
      "Login page accessible",
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    // Check if OAuth buttons are present
    const hasGoogle =
      response.body.includes("Google") || response.body.includes("google");
    const hasGitHub =
      response.body.includes("GitHub") || response.body.includes("github");
    const hasMicrosoft =
      response.body.includes("Microsoft") || response.body.includes("azure");

    logTest("Google OAuth button present", hasGoogle);
    logTest("GitHub OAuth button present", hasGitHub);
    logTest("Microsoft OAuth button present", hasMicrosoft);

    return response.statusCode === 200;
  } catch (error) {
    logTest("Login page accessible", false, `Error: ${error.message}`);
    return false;
  }
}

async function testAuthEndpoint() {
  console.log("\n🔧 Testing NextAuth API Endpoint...\n");

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/providers`);
    logTest(
      "NextAuth API endpoint accessible",
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    if (response.statusCode === 200) {
      try {
        const providers = JSON.parse(response.body);
        const providerNames = Object.keys(providers);

        logTest("Google provider configured", providerNames.includes("google"));
        logTest("GitHub provider configured", providerNames.includes("github"));
        logTest(
          "Azure AD provider configured",
          providerNames.includes("azure-ad")
        );
        logTest(
          "Credentials provider configured",
          providerNames.includes("credentials")
        );

        console.log(`   Found providers: ${providerNames.join(", ")}`);
      } catch (e) {
        logWarning("Provider parsing", "Could not parse providers response");
      }
    }

    return response.statusCode === 200;
  } catch (error) {
    logTest(
      "NextAuth API endpoint accessible",
      false,
      `Error: ${error.message}`
    );
    return false;
  }
}

async function testSessionEndpoint() {
  console.log("\n👤 Testing Session Endpoint (Unauthenticated)...\n");

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/session`);
    logTest(
      "Session endpoint accessible",
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    if (response.statusCode === 200) {
      const isEmpty =
        response.body === "{}" ||
        response.body === "null" ||
        response.body.trim() === "";
      logTest(
        "Unauthenticated session is empty",
        isEmpty,
        `Response: ${response.body.substring(0, 100)}`
      );
    }

    return response.statusCode === 200;
  } catch (error) {
    logTest("Session endpoint accessible", false, `Error: ${error.message}`);
    return false;
  }
}

async function testProtectedRouteRedirect() {
  console.log("\n🚪 Testing Protected Route Redirect...\n");

  try {
    const response = await makeRequest(`${BASE_URL}/dashboard`, {
      redirect: "manual",
    });

    const isRedirect =
      response.statusCode === 307 || response.statusCode === 302;
    logTest(
      "Dashboard redirects when not authenticated",
      isRedirect,
      `Status: ${response.statusCode}`
    );

    if (isRedirect && response.headers.location) {
      const redirectUrl = response.headers.location;
      const hasCallbackUrl = redirectUrl.includes("callbackUrl");
      logTest(
        "Redirect preserves callback URL",
        hasCallbackUrl,
        `Redirect to: ${redirectUrl}`
      );
    }

    return isRedirect;
  } catch (error) {
    logTest("Protected route redirect", false, `Error: ${error.message}`);
    return false;
  }
}

async function testMiddlewareExecution() {
  console.log("\n⚙️  Testing Middleware Execution...\n");

  try {
    // Test public route (should not redirect)
    const publicResponse = await makeRequest(`${BASE_URL}/`);
    const publicAccessible =
      publicResponse.statusCode === 200 || publicResponse.statusCode === 307;
    logTest(
      "Public route accessible",
      publicAccessible,
      `Status: ${publicResponse.statusCode}`
    );

    // Test auth route (should be accessible when not logged in)
    const authResponse = await makeRequest(`${BASE_URL}/auth/login`);
    logTest(
      "Auth route accessible when not logged in",
      authResponse.statusCode === 200,
      `Status: ${authResponse.statusCode}`
    );

    // Test API auth route (should pass through)
    const apiAuthResponse = await makeRequest(`${BASE_URL}/api/auth/session`);
    logTest(
      "API auth route passes through middleware",
      apiAuthResponse.statusCode === 200,
      `Status: ${apiAuthResponse.statusCode}`
    );

    return true;
  } catch (error) {
    logTest("Middleware execution", false, `Error: ${error.message}`);
    return false;
  }
}

async function testCSRFToken() {
  console.log("\n🔒 Testing CSRF Protection...\n");

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/csrf`);
    logTest(
      "CSRF endpoint accessible",
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    if (response.statusCode === 200) {
      try {
        const csrf = JSON.parse(response.body);
        logTest(
          "CSRF token generated",
          !!csrf.csrfToken,
          `Token length: ${csrf.csrfToken?.length || 0}`
        );
      } catch (e) {
        logWarning("CSRF parsing", "Could not parse CSRF response");
      }
    }

    return response.statusCode === 200;
  } catch (error) {
    logTest("CSRF endpoint", false, `Error: ${error.message}`);
    return false;
  }
}

async function testOAuthProviderEndpoints() {
  console.log("\n🌐 Testing OAuth Provider Endpoints...\n");

  const providers = ["google", "github", "azure-ad"];

  for (const provider of providers) {
    try {
      const response = await makeRequest(
        `${BASE_URL}/api/auth/signin/${provider}`,
        {
          redirect: "manual",
        }
      );

      const isRedirect =
        response.statusCode === 307 || response.statusCode === 302;
      logTest(
        `${provider} OAuth endpoint configured`,
        isRedirect,
        `Status: ${response.statusCode}`
      );

      if (isRedirect && response.headers.location) {
        const redirectUrl = response.headers.location;
        const isOAuthUrl =
          redirectUrl.includes("oauth") ||
          redirectUrl.includes("authorize") ||
          redirectUrl.includes("login");
        logTest(
          `${provider} redirects to OAuth provider`,
          isOAuthUrl,
          `Redirects to: ${redirectUrl.substring(0, 50)}...`
        );
      }
    } catch (error) {
      logTest(`${provider} OAuth endpoint`, false, `Error: ${error.message}`);
    }
  }
}

async function testCredentialsEndpoint() {
  console.log("\n📝 Testing Credentials Provider Endpoint...\n");

  try {
    // Get CSRF token first
    const csrfResponse = await makeRequest(`${BASE_URL}/api/auth/csrf`);
    let csrfToken = "";

    if (csrfResponse.statusCode === 200) {
      try {
        const csrf = JSON.parse(csrfResponse.body);
        csrfToken = csrf.csrfToken;
      } catch (e) {
        logWarning(
          "CSRF token",
          "Could not get CSRF token for credentials test"
        );
      }
    }

    // Test credentials signin endpoint exists
    const response = await makeRequest(
      `${BASE_URL}/api/auth/signin/credentials`,
      {
        redirect: "manual",
      }
    );

    logTest(
      "Credentials signin endpoint exists",
      response.statusCode === 200 || response.statusCode === 405,
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    logTest("Credentials endpoint", false, `Error: ${error.message}`);
  }
}

async function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log("\n❌ Failed Tests:");
    results.failed.forEach(({ name, message }) => {
      console.log(`   - ${name}`);
      if (message) console.log(`     ${message}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    results.warnings.forEach(({ name, message }) => {
      console.log(`   - ${name}`);
      if (message) console.log(`     ${message}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("📝 MANUAL TESTING REQUIRED:");
  console.log("=".repeat(60));
  console.log("The following tests require manual browser testing:");
  console.log("1. ✋ Credentials login with email/password");
  console.log("2. ✋ Google OAuth login flow");
  console.log("3. ✋ GitHub OAuth login flow");
  console.log("4. ✋ Azure AD OAuth login flow (if configured)");
  console.log("5. ✋ Session persistence across page refreshes");
  console.log("6. ✋ Role-based access control");
  console.log("7. ✋ Logout functionality");
  console.log("8. ✋ Callback URL preservation");
  console.log("\n👉 Open http://localhost:3001/auth/login in your browser");
  console.log("👉 Test credentials: admin@csir.co.za / password123");
  console.log("=".repeat(60) + "\n");
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting Authentication Flow Tests...");
  console.log("Target: " + BASE_URL);
  console.log("=".repeat(60));

  const serverRunning = await testServerRunning();

  if (!serverRunning) {
    console.log(
      "\n❌ Server is not running. Please start the development server:"
    );
    console.log("   npm run dev");
    process.exit(1);
  }

  await testLoginPageAccess();
  await testAuthEndpoint();
  await testSessionEndpoint();
  await testProtectedRouteRedirect();
  await testMiddlewareExecution();
  await testCSRFToken();
  await testOAuthProviderEndpoints();
  await testCredentialsEndpoint();

  await printSummary();
}

// Run the tests
runTests().catch(console.error);
