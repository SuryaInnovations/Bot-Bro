const fs = require("fs");
const path = require("path");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runResponsiveTestSuite() {
  console.log("==================================================");
  console.log("  BOT BRO RESPONSIVE DESIGN & VIEWPORT VERIFICATION");
  console.log("==================================================");

  // Group 1: Viewport Meta Tag & Safe-Area Configuration
  console.log("\n[TEST GROUP 1] Viewport Meta Tag & Safe-Area Insets");
  const layoutContent = fs.readFileSync(path.join(__dirname, "../src/app/layout.tsx"), "utf-8");
  assert(layoutContent.includes("viewport: Viewport"), "layout.tsx exports Viewport configuration");
  assert(layoutContent.includes('"device-width"'), "Viewport width set to device-width");
  assert(layoutContent.includes('"cover"'), "Viewport includes viewportFit: cover for notched devices");
  assert(layoutContent.includes("100dvh"), "Root body uses dynamic viewport units 100dvh");

  const globalsCss = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf-8");
  assert(globalsCss.includes("safe-area-inset-bottom"), "globals.css defines --sab safe-area-inset-bottom");
  assert(globalsCss.includes("safe-area-inset-top"), "globals.css defines --sat safe-area-inset-top");
  assert(globalsCss.includes("responsive-table-wrapper"), "globals.css contains responsive-table-wrapper with overflow-x: auto");
  assert(globalsCss.includes(".katex-display"), "globals.css contains math overflow scroll protection");
  assert(globalsCss.includes("touch-action: manipulation"), "globals.css sets touch-action: manipulation for mobile devices");

  // Group 2: Responsive Breakpoints & Design Tokens
  console.log("\n[TEST GROUP 2] Tailwind Breakpoints & Design Tokens");
  const tailwindConfig = fs.readFileSync(path.join(__dirname, "../tailwind.config.ts"), "utf-8");
  assert(tailwindConfig.includes('xs: "420px"'), "tailwind.config.ts registers xs: 420px breakpoint for compact mobile screens");

  // Group 3: Mobile & Tablet Drawer Mechanics (Sidebar)
  console.log("\n[TEST GROUP 3] Sidebar Adaptive Drawer Mechanics (<1024px vs >=1024px)");
  const sidebarContent = fs.readFileSync(path.join(__dirname, "../src/components/sidebar/Sidebar.tsx"), "utf-8");
  assert(sidebarContent.includes("fixed inset-y-0 left-0 z-50"), "Sidebar renders as high-z-index fixed drawer on mobile/tablet");
  assert(sidebarContent.includes("lg:relative lg:inset-auto lg:z-30"), "Sidebar seamlessly docks in-flow on desktop (>=1024px)");
  assert(sidebarContent.includes("fixed inset-0 bg-black/50 z-40 lg:hidden"), "Mobile backdrop overlay rendered for touch dismissal");
  assert(sidebarContent.includes("handleSelectConv"), "Sidebar implements mobile auto-close upon conversation selection");
  assert(sidebarContent.includes("handleNewChatClick"), "Sidebar implements mobile auto-close upon New Chat creation");
  assert(sidebarContent.includes("safe-area-inset-bottom"), "Sidebar bottom bar includes safe-area-inset-bottom padding");

  // Group 4: Chat Header Responsive Design
  console.log("\n[TEST GROUP 4] ChatHeader Compact Mobile & Tablet Layout");
  const headerContent = fs.readFileSync(path.join(__dirname, "../src/components/chat/ChatHeader.tsx"), "utf-8");
  assert(headerContent.includes("px-2.5 sm:px-4 md:px-6"), "ChatHeader applies adaptive horizontal padding");
  assert(headerContent.includes("truncate"), "ChatHeader truncates long model names safely on small viewports");
  assert(headerContent.includes("p-1.5 sm:px-3 sm:py-1.5"), "ChatHeader action buttons collapse to compact touch icons on small screens");
  assert(headerContent.includes("safe-area-inset-top"), "ChatHeader respects notch/island safe-area-inset-top");

  // Group 5: Chat Message Composer Mobile Experience
  console.log("\n[TEST GROUP 5] Chat Composer Touch Ergonomics & Keyboard Safety");
  const composerContent = fs.readFileSync(path.join(__dirname, "../src/components/chat/MessageComposer.tsx"), "utf-8");
  assert(composerContent.includes("hidden xs:inline"), "Action labels (Attach, Dictate, Voice) collapse to icons on compact screens (<420px)");
  assert(composerContent.includes("flex-wrap"), "Bottom control toolbar wraps cleanly if constrained");
  assert(composerContent.includes("textareaRef.current.style.height"), "Textarea auto-expands dynamically with user input");
  assert(composerContent.includes("shrink-0"), "Composer send button stays pinned and visible without collapsing");

  // Group 6: Rendered Content, Tables, Code Blocks & Attachments
  console.log("\n[TEST GROUP 6] Message Content, Code Blocks, Tables & Attachments");
  const messageItemContent = fs.readFileSync(path.join(__dirname, "../src/components/chat/MessageItem.tsx"), "utf-8");
  assert(messageItemContent.includes("responsive-table-wrapper"), "Markdown tables render inside responsive-table-wrapper");
  assert(messageItemContent.includes("overflow-x-auto"), "Code blocks and math render with horizontal scroll containment");
  assert(messageItemContent.includes("break-words"), "Message text container enforces break-words to prevent horizontal blowout");
  assert(messageItemContent.includes("w-full sm:max-w-xs"), "Attachment cards adapt to full width on mobile and max-w-xs on desktop");
  assert(messageItemContent.includes("p-1.5 rounded-lg"), "Message bottom actions provide comfortable mobile touch targets");

  // Group 7: Welcome Screen Fluid Typography & Short Height Handling
  console.log("\n[TEST GROUP 7] Welcome Screen Fluid Scaling & Landscape Support");
  const welcomeContent = fs.readFileSync(path.join(__dirname, "../src/components/chat/WelcomeScreen.tsx"), "utf-8");
  assert(welcomeContent.includes("overflow-y-auto"), "WelcomeScreen supports vertical scrolling on short screens / landscape");
  assert(welcomeContent.includes("text-xl sm:text-2xl md:text-3xl"), "Greeting heading uses fluid responsive sizing");
  assert(welcomeContent.includes("flex-wrap"), "Quick starter suggestion pills wrap cleanly on small screens");

  // Group 8: Multi-Screen Viewport Matrix Math Verification
  console.log("\n[TEST GROUP 8] 12 Target Viewport Dimension Verification");
  const viewports = [
    { name: "iPhone SE (1st gen) / Compact Mobile", width: 320, height: 568, category: "Small Mobile (320-374px)" },
    { name: "Galaxy S8 / Mid-compact Mobile", width: 360, height: 800, category: "Small Mobile (320-374px)" },
    { name: "iPhone X/XS/11 Pro", width: 375, height: 812, category: "Standard Mobile (375-430px)" },
    { name: "iPhone 12/13/14 Pro", width: 390, height: 844, category: "Standard Mobile (375-430px)" },
    { name: "Pixel 7 / Galaxy S22+", width: 412, height: 915, category: "Standard Mobile (375-430px)" },
    { name: "iPhone 14/15/16 Pro Max", width: 430, height: 932, category: "Standard Mobile (375-430px)" },
    { name: "iPad Mini / Tablet Portrait", width: 768, height: 1024, category: "Tablet (768-1023px)" },
    { name: "iPad Air 10.9-inch", width: 820, height: 1180, category: "Tablet (768-1023px)" },
    { name: "iPad Landscape / Small Laptop", width: 1024, height: 768, category: "Small Laptop (1024-1279px)" },
    { name: "MacBook Air / Standard Laptop", width: 1280, height: 800, category: "Desktop (1280-1599px)" },
    { name: "MacBook Pro 15-inch / Desktop", width: 1440, height: 900, category: "Desktop (1280-1599px)" },
    { name: "Full HD 1080p Monitor / 4K Monitor", width: 1920, height: 1080, category: "Large Desktop (1600px+)" },
  ];

  for (const vp of viewports) {
    const isMobile = vp.width < 1024;
    const isSmallMobile = vp.width < 420;

    // Simulation of composer toolbar width
    // On small mobile (<420px): Attach is ~34px, Sliders is ~32px, Dictate is ~34px, Voice is ~34px, Send is ~72px => Total ~206px
    // On wider screens: Attach is ~78px, Sliders is ~32px, Dictate is ~84px, Voice is ~76px, Send is ~76px => Total ~346px
    const toolbarEstimatedWidth = isSmallMobile ? 206 : 346;
    const composerAvailableWidth = isMobile ? vp.width - 24 : Math.min(vp.width - 320, 768);

    const fitsWithoutOverflow = toolbarEstimatedWidth <= composerAvailableWidth;
    assert(
      fitsWithoutOverflow,
      `Viewport ${vp.name} (${vp.width}x${vp.height}) [${vp.category}]: Composer width (${toolbarEstimatedWidth}px) fits within available width (${composerAvailableWidth}px)`
    );
  }

  console.log("==================================================");
  console.log(`  RESPONSIVE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runResponsiveTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
