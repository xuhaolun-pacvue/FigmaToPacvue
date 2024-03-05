
<template>
  <div>
    <div style="display: flex;margin: 8px 0 12px;">
      <div class="switchbutton" :class="{active: mode == 'tailwind'}" style="border-top-left-radius: 4px; border-bottom-left-radius: 4px;" @click="changeMode('tailwind')">
        Tailwind CSS + Html
      </div>
      <div class="switchbutton" :class="{active: mode == 'style'}" style="border-top-right-radius: 4px; border-bottom-right-radius: 4px;" @click="changeMode('style')">
        Style
      </div>
    </div>
    <div @click="copyText" class="copyButton">复制 Copy</div>
    <highlightjs :code="code"/>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
const code = ref(``)
const mode = ref('tailwind')
const copyText = ()=>{
  // 创建一个临时的textarea元素
  const tempTextarea = document.createElement('textarea');
  tempTextarea.value = code.value;

  // 将textarea元素添加到文档中
  document.body.appendChild(tempTextarea);

  // 选择文本
  tempTextarea.select();
  tempTextarea.setSelectionRange(0, 99999); // 兼容移动设备

  // 尝试执行复制操作
  try {
    document.execCommand('copy');
    console.log('文本已成功复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
  }

  // 移除临时的textarea元素
  document.body.removeChild(tempTextarea);
}
onMounted(()=>{
  window.onmessage = (event: MessageEvent) => {
    const message = event.data.pluginMessage;
    switch (message.type) {
      case "code":
        code.value = message.data
        break
    }
  }

})
const changeMode = (type: string)=>{
  mode.value = type
  parent.postMessage({ pluginMessage: { type:'pluginSettingChanged', key: 'mode', value: type } }, '*')
}
</script>


<style>
.switchbutton{
  padding: 8px 16px;
  background: #fff;
  border: 1px #FF9F43 solid;
  border-color: #DEDFE3;
  font-size: 14px;
  cursor: pointer;
}
.switchbutton.active{
  border-color: #FF9F43;
  background: #ff9f430d;
}
.copyButton{
  padding: 8px 0;
  width: 100%;
  background: #FF9F43;
  color: #fff;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
}
.copyButton:hover{
  box-shadow: 0 0 12px -2px #ff9f43;
}
.copyButton:active{
  border-color: #cc7f36;
  background-color: #cc7f36;
  outline: none;
}
code {
  width: 400px;
  min-height: 458px;
  border-radius: 6px;
}
</style>