const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

let mainWindow;

// ===== 激活系统配置 =====
// 这是密钥盐，只有我知道，用来生成激活码
const SECRET_SALT = 'YueHuo_2026_ShangHai_NursingHome!@#';

const ACTIVATION_FILE = path.join(app.getPath('userData'), 'activation.json');

// 生成机器码（基于硬件信息，保持稳定）
function getMachineCode() {
  const raw = [
    os.hostname(),
    os.cpus()[0]?.model || 'unknown',
    os.machine(),
    os.arch(),
    // MAC 地址（取第一个非本地回环的）
    (() => {
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        const iface = nets[name];
        if (!iface) continue;
        for (const info of iface) {
          if (!info.internal && info.mac && info.mac !== '00:00:00:00:00:00') {
            return info.mac;
          }
        }
      }
      return '00:00:00:00:00:00';
    })(),
  ].join('||');
  
  return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
}

// 根据机器码生成激活码
function generateActivationCode(machineCode) {
  return crypto.createHash('sha256')
    .update(machineCode + SECRET_SALT)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}

// 校验激活码
function verifyActivationCode(machineCode, userCode) {
  const expected = generateActivationCode(machineCode);
  return expected === userCode.toUpperCase().trim();
}

// 读取激活状态
function getActivationStatus() {
  try {
    if (fs.existsSync(ACTIVATION_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVATION_FILE, 'utf-8'));
      return {
        activated: true,
        machineCode: data.machineCode,
        activatedAt: data.activatedAt,
      };
    }
  } catch {}
  return { activated: false, machineCode: null, activatedAt: null };
}

// 保存激活状态
function saveActivation(machineCode) {
  ensureDataDir();
  fs.writeFileSync(ACTIVATION_FILE, JSON.stringify({
    machineCode,
    activatedAt: new Date().toISOString(),
  }, null, 2), 'utf-8');
}

// ===== 数据文件管理 =====
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const DATA_FILE = path.join(DATA_DIR, 'yuehuo-data.json');
const DATA_VERSION = 1;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ===== IPC 处理器 =====

// 激活相关
ipcMain.handle('activation:getMachineCode', async () => {
  const machineCode = getMachineCode();
  return { machineCode };
});

ipcMain.handle('activation:check', async () => {
  return getActivationStatus();
});

ipcMain.handle('activation:activate', async (_event, userCode) => {
  const machineCode = getMachineCode();
  const valid = verifyActivationCode(machineCode, userCode);
  
  if (valid) {
    saveActivation(machineCode);
    return { ok: true, message: '激活成功！' };
  }
  return { ok: false, message: '激活码无效，请确认输入正确。' };
});

// 数据相关
ipcMain.handle('data:save', async (_event, jsonData) => {
  try {
    ensureDataDir();
    const payload = {
      version: DATA_VERSION,
      savedAt: new Date().toISOString(),
      data: jsonData,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    console.error('保存数据失败:', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('data:load', async () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { ok: true, data: null };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const payload = JSON.parse(raw);
    return { ok: true, data: payload.data || null, savedAt: payload.savedAt || null };
  } catch (err) {
    console.error('读取数据失败:', err);
    return { ok: false, error: err.message, data: null };
  }
});

ipcMain.handle('data:info', async () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { ok: true, exists: false, size: 0 };
    }
    const stat = fs.statSync(DATA_FILE);
    return {
      ok: true,
      exists: true,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      dataDir: DATA_DIR,
    };
  } catch (err) {
    return { ok: false, error: err.message, exists: false, size: 0 };
  }
});

ipcMain.handle('data:clear', async () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('app:info', async () => {
  return {
    platform: process.platform,
    version: app.getVersion(),
    userData: app.getPath('userData'),
    dataFile: DATA_FILE,
    isElectron: true,
  };
});

// ===== 窗口 =====

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '悦活 - 养老院活动管理系统',
    icon: path.join(__dirname, '../public/logo.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
