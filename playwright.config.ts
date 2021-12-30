import { PlaywrightTestConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
    use: {
        baseURL: "http://localhost:3000",
        headless: true,
    },
    projects: [
        {
            name: "desktop-chrome",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "desktop-firefox",
            use: { ...devices["Desktop Firefox"] },
        },
        {
            name: "desktop-edge",
            use: { ...devices["Desktop Edge"] },
        },
        {
            name: "desktop-webkit",
            use: { ...devices["Desktop Safari"] },
        },
        {
            name: "iphone6-webkit",
            use: {
                browserName: "webkit",
                ...devices["iPhone 6"],
            },
        },
        {
            name: "iphone6-chromium",
            use: {
                browserName: "chromium",
                ...devices["iPhone 6"],
            },
        },
        {
            name: "iphone7-webkit",
            use: {
                browserName: "webkit",
                ...devices["iPhone 7"],
            },
        },
        {
            name: "iphone7-chromium",
            use: {
                browserName: "chromium",
                ...devices["iPhone 7"],
            },
        },
        {
            name: "iphone8-webkit",
            use: {
                browserName: "webkit",
                ...devices["iPhone 8"],
            },
        },
        {
            name: "iphone8-chromium",
            use: {
                browserName: "chromium",
                ...devices["iPhone 8"],
            },
        },
        {
            name: "iphonex-webkit",
            use: {
                browserName: "webkit",
                ...devices["iPhone X"],
            },
        },
        {
            name: "iphonex-chromium",
            use: {
                browserName: "chromium",
                ...devices["iPhone X"],
            },
        },
        {
            name: "iphone11-webkit",
            use: {
                browserName: "webkit",
                ...devices["iPhone 11"],
            },
        },
        {
            name: "iphone11-chromium",
            use: {
                browserName: "chromium",
                ...devices["iPhone 11"],
            },
        },
        {
            name: "iphone12-webkit",
            use: {
                browserName: "webkit",
                ...devices["iPhone 12"],
            },
        },
        {
            name: "iphone12-chromium",
            use: {
                browserName: "chromium",
                ...devices["iPhone 12"],
            },
        },
        {
            name: "galaxy-note3-chromium",
            use: {
                browserName: "chromium",
                ...devices["Galaxy Note 3"],
            },
        },
        {
            name: "galaxy-note2-chromium",
            use: {
                browserName: "chromium",
                ...devices["Galaxy Note II"],
            },
        },
        {
            name: "galaxy-s3-chromium",
            use: {
                browserName: "chromium",
                ...devices["Galaxy S III"],
            },
        },
        {
            name: "galaxy-s5-chromium",
            use: {
                browserName: "chromium",
                ...devices["Galaxy S5"],
            },
        },
        {
            name: "galaxy-s8-chromium",
            use: {
                browserName: "chromium",
                ...devices["Galaxy S8"],
            },
        },
        {
            name: "galaxy-s9+-chromium",
            use: {
                browserName: "chromium",
                ...devices["Galaxy S9+"],
            },
        },
        {
            name: "galaxy-tab-s4-chromium",
            use: {
                browserName: "chromium",
                ...devices["Galaxy Tab S4"],
            },
        },
        {
            name: "pixel2-chromium",
            use: {
                browserName: "chromium",
                ...devices["Pixel 2"],
            },
        },
        {
            name: "pixel3-chromium",
            use: {
                browserName: "chromium",
                ...devices["Pixel 3"],
            },
        },
        {
            name: "pixel4-chromium",
            use: {
                browserName: "chromium",
                ...devices["Pixel 4"],
            },
        },
        {
            name: "pixel4a-chromium",
            use: {
                browserName: "chromium",
                ...devices["Pixel 4a (5G)"],
            },
        },
        {
            name: "pixel5-chromium",
            use: {
                browserName: "chromium",
                ...devices["Pixel 5"],
            },
        },
    ],
};

export default config;
