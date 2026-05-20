/**
 * 激活码生成器 —— 我这边用
 * 
 * 用法：node gen_activation.js <机器码>
 * 
 * 示例：
 *   node gen_activation.js ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890
 * 
 * 输出：激活码 (16位大写字母+数字)
 */

const crypto = require('crypto');

// 必须和 electron/main.cjs 中的 SECRET_SALT 一致
const SECRET_SALT = 'YueHuo_2026_ShangHai_NursingHome!@#';

function generate(machineCode) {
  if (!machineCode || machineCode.length < 10) {
    console.error('❌ 机器码无效，请确认复制了完整的机器码');
    process.exit(1);
  }

  const code = crypto.createHash('sha256')
    .update(machineCode.trim().toUpperCase() + SECRET_SALT)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();

  console.log('');
  console.log('=== 激活码生成结果 ===');
  console.log('');
  console.log(`  机器码: ${machineCode.trim().toUpperCase()}`);
  console.log(`  激活码: ${code}`);
  console.log('');
  console.log('格式：每4位一组');
  console.log(`        ${code.substring(0,4)}-${code.substring(4,8)}-${code.substring(8,12)}-${code.substring(12,16)}`);
  console.log('');
  console.log('直接发给用户输入即可。');
  console.log('');
}

// 支持从命令行参数或交互式输入
const machineCode = process.argv[2];
if (machineCode) {
  generate(machineCode);
} else {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('请输入机器码: ', (answer) => {
    generate(answer.trim());
    rl.close();
  });
}
