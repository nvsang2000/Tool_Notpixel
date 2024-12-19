const puppeteer = require("puppeteer-extra");
const path = require("path");
const {
  checkIframeAndGetQueryId,
  setDelay,
  playTool,
  handleFrame,
  handleCanvasClick,
  clickButton,
  handleButtons,
} = require("./helper");

(async () => {
  try {
    const dataSets = ["data_user"];
    const bypassTele = path.join(__dirname, "./telewebtoadrv2");

    for (const dataSet of dataSets) {
      const userDataDir = path.resolve(__dirname, `./data/${dataSet}`);
      const browser = await puppeteer.launch({
        headless: false,
        userDataDir: userDataDir,
        defaultViewport: null,
        args: [
          "--window-size=300,700",
          `--disable-extensions-except=${bypassTele}`,
          `--load-extension=${bypassTele}`,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--ignore-certificate-errors",
          "--disable-infobars",
          "--disable-session-crashed-bubble",
          "--disable-features=InfiniteSessionRestore",
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
          "--disable-notifications",
          "--disable-popup-blocking",
          "--disable-translate",
        ],
      });
      goNotPixel(browser);
    }
  } catch (err) {
    console.error("Error in main function:", err);
  }
})();

async function goNotPixel(browser) {
  const startTime = Date.now();

  while (true) {
    const elapsedTime = (Date.now() - startTime) / 1000;

    if (elapsedTime >= 300) {
      console.log("Hết thời gian session, chạy lại goNotPixel...");
      return await goNotPixel(browser); // Gọi lại từ đầu
    }

    const page = await browser.newPage();
    try {
      await page.goto(`https://web.telegram.org/a/#7249432100`, {
        waitUntil: "networkidle2",
      });
      await setDelay(4000);
      await playTool(page);
      await frameNotpixel(page);
      await handleDivs(page, startTime);
      await setDelay(20000);
    } catch (err) {
      console.error("Lỗi trong goNotPixel, đợi 20s, thực hiện lại...");
      await setDelay(20000);
      return await goNotPixel(browser); // Thử lại từ đầu
    } finally {
      await page.close();
    }
  }
}

async function frameNotpixel(page) {
  const newFrame = await handleFrame(page);
  const frameUrl = newFrame.url();
  if (frameUrl) {
    const requestID = await checkIframeAndGetQueryId(page);
    if (requestID && requestID.src) {
      await page.goto(requestID.src, { waitUntil: "networkidle2" });
      await setDelay(4000);
    } else {
      console.log("Không tìm thấy requestID hoặc src.");
    }
  } else {
    console.log("Không tìm thấy chuỗi user% trong URL của iframe.");
  }

  await page.waitForSelector("#canvasHolder");

  const targetButton = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return (
      buttons.find((btn) => btn.textContent.trim() === "Let’s Gooooooo!") ||
      null
    );
  });

  await clickButton(page, targetButton);
  await page.goto("https://app.notpx.app/claiming", {
    waitUntil: "networkidle2",
  });
}

async function waitAndClickCloseDiv(page) {
  try {
    console.log("Đang chờ thẻ template xuất hiện...");
    await page.waitForSelector("div._close_container_gb8eq_23", {
      timeout: 2000,
    });
    await page.click("div._close_container_gb8eq_23 > div._close_gb8eq_23");
  } catch (err) {
    console.error("Không hiển thị model select template:");
  }
}

async function handleDivs(page, startTime) {
  const keywords = ["repeat", " repeat"];
  try {
    await waitAndClickCloseDiv(page);
    const arrayUrl = [
      "https://app.notpx.app/claiming",
      "https://web.telegram.org/a/#7249432100",
    ];

    while (true) {
      const currentUrl = page.url();
      const elapsedTime = (Date.now() - startTime) / 1000;

      if (elapsedTime >= 300) {
        console.log("Hết thời gian session, refesh lại page!");
        return; // Thoát hàm `handleDivs` để quay lại `goNotPixel`
      }

      if (!arrayUrl.includes(currentUrl)) {
        await page.goto("https://app.notpx.app/claiming", {
          waitUntil: "networkidle2",
        });
        await waitAndClickCloseDiv(page);
      }

      const divs = await page.$$('div[style="opacity: 1;"]');
      await setDelay(4000);

      for (let i = 0; i < divs.length; i++) {
        const div = divs[i];
        const divText = await page.evaluate(
          (el) => el.textContent.trim().toLowerCase(),
          div
        );
        const isMatch = keywords.some((keyword) =>
          divText.includes(keyword.toLowerCase())
        );

        if (isMatch) {
          console.log(`Div ${i + 1}: "${divText}" chứa từ khóa.`);

          const match = divText.match(/\d+/);
          const singleNumber = match ? parseInt(match[0], 10) : 0;

          if (singleNumber > 0) {
            await setDelay(2000);

            const boundingBox = await div.boundingBox();
            const randomX = boundingBox.x + Math.random() * boundingBox.width;
            const randomY = boundingBox.y + Math.random() * boundingBox.height;

            await page.mouse.click(randomX, randomY);
            console.log(`Đã click vào div "${divText}"`);
            console.log(`Tọa độ (${randomX}, ${randomY})`);
            await setDelay(2000);
          } else {
            console.log("Không tìm thấy số trong chuỗi.");
          }

          break;
        }
      }

      for (let seconds = 65; seconds > 0; seconds--) {
        process.stdout.write(`\rĐếm ngược: ${seconds}s`);
        await setDelay(1000);
      }

      console.log(`\nTiếp tục...${elapsedTime}s`);
    }
  } catch (err) {
    console.error("Bị văng khỏi vòng lặp click QC");
    await handleDivs(page, startTime);
  }
}

async function autoClickButtonPaint(params) {
  if (!targetButton) {
    // Tìm và click vào button có class "_button_wekpw_2" và img src chứa đoạn string cụ thể
    const buttonClicked = await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll("button._button_wekpw_2")
      );
      const specialButton = buttons.find((button) => {
        const img = button.querySelector("img._image_wekpw_19");
        return (
          img &&
          img.src.includes("https://static.notpx.app/templates/7200016718.png")
        );
      });
      if (specialButton) {
        specialButton.click();
        return true;
      }
      return false;
    });

    if (buttonClicked) {
      console.log("Đã click vào button có class");
    } else {
      console.log("Không tìm thấy button có class");
    }

    // Cập nhật phạm vi tọa độ tại đây
    const xRange = { min: 50, max: 150 };
    const yRange = { min: 50, max: 150 };
    const targetColor = "rgb(255, 150, 0)"; // Màu bạn muốn kiểm tra
    await handleCanvasClick(page, canvasHandle, xRange, yRange, targetColor);
  }
  await handleButtons(page, ["Paint", "paint"]);
}
