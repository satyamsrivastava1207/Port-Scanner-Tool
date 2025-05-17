document.getElementById('scanForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const target = document.getElementById('target').value.trim();
  const portRange = document.getElementById('portRange').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const resultsSection = document.getElementById('resultsSection');
  const resultsList = document.getElementById('resultsList');
  const progressSection = document.getElementById('progressSection');
  const loader = document.getElementById('loader');
  const timeTaken = document.getElementById('timeTaken');
  const downloadBtn = document.getElementById('downloadBtn');

  // Reset display
  errorMsg.textContent = '';
  resultsSection.style.display = 'none';
  resultsList.innerHTML = '';
  progressSection.style.display = 'block';
  loader.style.display = 'block';
  timeTaken.style.display = 'none';
  downloadBtn.style.display = 'none';

  if (!target || !portRange) {
    errorMsg.textContent = 'Please fill in both fields.';
    progressSection.style.display = 'none';
    return;
  }

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, portRange })
    });

    const data = await response.json();
    loader.style.display = 'none';

    if (!response.ok) {
      errorMsg.textContent = data.error || 'Unknown server error';
      return;
    }

    const openPorts = data.open_ports || [];
    const ip = data.ip_address || 'N/A';
    const hostname = data.hostname || 'N/A';
    const duration = data.duration || 0;

    const hostInfo = document.createElement('li');
    hostInfo.innerHTML = `<strong>IP Address:</strong> ${ip} | <strong>Hostname:</strong> ${hostname}`;
    hostInfo.style.marginBottom = '10px';
    resultsList.appendChild(hostInfo);

    const reportLines = [];
    reportLines.push(`Host: ${target}`);
    reportLines.push(`IP Address: ${ip}`);
    reportLines.push(`Hostname: ${hostname}`);
    reportLines.push(`Port Range: ${portRange}`);
    reportLines.push(`Scan Duration: ${duration} seconds`);
    reportLines.push(`-----------------------------`);

    if (openPorts.length > 0) {
      openPorts.forEach(item => {
        const line = `Port ${item.port} is open | Banner: ${item.banner}`;
        const li = document.createElement('li');
        li.textContent = line;
        resultsList.appendChild(li);
        reportLines.push(line);
      });
    } else {
      resultsList.innerHTML += '<li>No open ports found.</li>';
      reportLines.push('No open ports found.');
    }

    timeTaken.style.display = 'block';
    timeTaken.textContent = `Scan completed in ${duration} seconds`;

    resultsSection.style.display = 'block';
    downloadBtn.style.display = 'inline-block';

    downloadBtn.onclick = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 10;

      doc.setFontSize(12);
      reportLines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        doc.text(line, 10, y);
        y += 8;
      });

      const fileName = `port_scan_report_${target.replace(/[^\w\d]/g, '_')}.pdf`;
      doc.save(fileName);
    };

    // Save scan history
    const scanRecord = {
      target,
      ip,
      hostname,
      portRange,
      duration,
      timestamp: new Date().toLocaleString()
    };

    const historyList = document.getElementById('historyList');
    const historyItem = document.createElement('li');
    historyItem.textContent = `[${scanRecord.timestamp}] ${scanRecord.target} (${scanRecord.ip}) - ${scanRecord.portRange}`;
    historyList.prepend(historyItem);

    let history = JSON.parse(localStorage.getItem('scanHistory')) || [];
    history.unshift(scanRecord);
    localStorage.setItem('scanHistory', JSON.stringify(history));

  } catch (error) {
    loader.style.display = 'none';
    progressSection.style.display = 'none';
    errorMsg.textContent = 'Network error. Please try again.';
  }
});

// Load scan history on page load
window.addEventListener('DOMContentLoaded', () => {
  const history = JSON.parse(localStorage.getItem('scanHistory')) || [];
  const historyList = document.getElementById('historyList');
  history.forEach(entry => {
    const item = document.createElement('li');
    item.textContent = `[${entry.timestamp}] ${entry.target} (${entry.ip}) - ${entry.portRange}`;
    historyList.appendChild(item);
  });

  const clearBtn = document.getElementById('clearHistoryBtn');
  clearBtn.addEventListener('click', () => {
    localStorage.removeItem('scanHistory');
    historyList.innerHTML = '';
  });
});
