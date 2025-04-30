document.getElementById('scanForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const target = document.getElementById('target').value.trim();
  const portRange = document.getElementById('portRange').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const resultsSection = document.getElementById('resultsSection');
  const resultsList = document.getElementById('resultsList');
  const progressSection = document.getElementById('progressSection');

  // Reset outputs
  errorMsg.textContent = '';
  resultsSection.style.display = 'none';
  resultsList.innerHTML = '';
  progressSection.style.display = 'block';

  if (!target || !portRange) {
    errorMsg.textContent = 'Please fill in both fields.';
    progressSection.style.display = 'none';
    return;
  }

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ target, portRange })
    });

    const data = await response.json();

    progressSection.style.display = 'none';

    if (!response.ok) {
      errorMsg.textContent = data.error || 'Unknown server error';
      return;
    }

    const openPorts = data.open_ports || [];

    if (openPorts.length > 0) {
      openPorts.forEach(port => {
        const li = document.createElement('li');
        li.textContent = `Port ${port} is open`;
        resultsList.appendChild(li);
      });
    } else {
      resultsList.innerHTML = '<li>No open ports found.</li>';
    }

    resultsSection.style.display = 'block';

  } catch (error) {
    progressSection.style.display = 'none';
    errorMsg.textContent = 'Network error. Please try again.';
  }
});
