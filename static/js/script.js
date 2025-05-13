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

  errorMsg.textContent = '';
  resultsSection.style.display = 'none';
  resultsList.innerHTML = '';
  progressSection.style.display = 'block';
  loader.style.display = 'block';
  timeTaken.style.display = 'none';

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

    if (openPorts.length > 0) {
      openPorts.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `Port ${item.port} is open | Banner: ${item.banner}`;
        resultsList.appendChild(li);
      });
    } else {
      resultsList.innerHTML += '<li>No open ports found.</li>';
    }

    timeTaken.style.display = 'block';
    timeTaken.textContent = `Scan completed in ${duration} seconds`;
    resultsSection.style.display = 'block';

    saveScanToHistory(target, portRange, openPorts, ip, hostname, duration);
    downloadReport(target, portRange, ip, hostname, openPorts, duration);
    displayScanHistory();

  } catch (error) {
    loader.style.display = 'none';
    progressSection.style.display = 'none';
    errorMsg.textContent = 'Network error. Please try again.';
  }
});

function saveScanToHistory(target, portRange, openPorts, ip, hostname, duration) {
  const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
  history.unshift({
    timestamp: new Date().toISOString(),
    target,
    portRange,
    openPorts,
    ip,
    hostname,
    duration
  });
  localStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 10))); // Keep only last 10 entries
}

function displayScanHistory() {
  const historyList = document.getElementById('historyList');
  const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
  historyList.innerHTML = '';
  history.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `[${new Date(entry.timestamp).toLocaleString()}] Target: ${entry.target}, Range: ${entry.portRange}, Open: ${entry.openPorts.length}, Time: ${entry.duration}s`;
    historyList.appendChild(li);
  });
}

function downloadReport(target, portRange, ip, hostname, openPorts, duration) {
  let report = `Scan Report\n===========\n`;
  report += `Target: ${target}\nIP Address: ${ip}\nHostname: ${hostname}\nPort Range: ${portRange}\nDuration: ${duration} seconds\n\n`;
  report += `Open Ports:\n`;
  if (openPorts.length === 0) {
    report += `No open ports found.\n`;
  } else {
    openPorts.forEach(p => {
      report += `Port ${p.port}: ${p.banner}\n`;
    });
  }

  const blob = new Blob([report], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `scan_report_${target.replaceAll('.', '_')}.txt`;
  link.click();
}

// Load history on page load
window.addEventListener('DOMContentLoaded', displayScanHistory);
