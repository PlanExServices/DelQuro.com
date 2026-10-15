import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',timeout:30000,workers:2,retries:process.env.CI?1:0,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:process.env.SITE_URL||'http://127.0.0.1:8080',browserName:'chromium',viewport:{width:1280,height:720},trace:'retain-on-failure',screenshot:'only-on-failure'}
});
