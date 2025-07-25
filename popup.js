document.getElementById('fetchBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeAndAskAI
  });
});

async function scrapeAndAskAI() {
  const oddsElements = document.querySelectorAll('.coupontype, .bet_class, .odd_class');
  let textData = '';
  oddsElements.forEach(el => textData += el.innerText + '\n');

  if (!textData.trim()) {
    alert("ডেটা পাইনি! সঠিক পেজে আছেন তো?");
    return;
  }

  const apiKey = 'YOUR_OPENAI_API_KEY'; // ← আপনার API key বসান

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "তুমি একজন রিয়েল টাইম betting গাইড AI। odds দেখে গাইড দাও।" },
        { role: "user", content: `১xBet থেকে পাওয়া odds:\n${textData}\n বিশ্লেষণ করে বলো কোনটা interesting এবং সম্ভাবনা কত?` }
      ]
    })
  });
  const data = await res.json();
  const answer = data.choices[0].message.content;
  chrome.runtime.sendMessage({ type: "AI_RESPONSE", answer });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "AI_RESPONSE") {
    document.getElementById('result').value = message.answer;
  }
});