let startTime;
let elapsedTime = 0;
let timerInterval;

function createLoadingBar(divCount) {
    const loadingBar = document.getElementById('loading-bar');

    for (let i = 0; i < divCount; i++) {
        const div = document.createElement('div');
        div.className = 'loading-bar-item';
        loadingBar.appendChild(div);
    }
}

function setLoadingProgress(percent, divCount) {
    const loadingBarItems = document.querySelectorAll('.loading-bar-item');
    const numItems = loadingBarItems.length;
    const progressWidth = percent / 100 * divCount;

    loadingBarItems.forEach((item, index) => {
        if (index < progressWidth) {
            item.style.width = (100 / divCount) + '%';
        } else {
            item.style.width = '0';
        }
    });
}

// Call the function to create the loading bar with 50 divs
createLoadingBar(50);


/*
----------------------- Loading Bar Script End ------------------------------------
*/





let totalUrls;
let processedUrls = 0;
let scanningPaused = false;
let scanningStarted = false;


//Load the server list
document.addEventListener("DOMContentLoaded", function () {
    // Populate server list dropdown from JSON file
    fetch('server_list.json')
        .then(response => response.json())
        .then(data => {
            const serverListDropdown = document.getElementById('serverList');
            const totalurls = document.getElementById('totalUrls')
            console.log("Server List Loaded.");
            data.forEach(server => {
                const option = document.createElement('option');
                option.text = `${server.name} - ${server.total}`;
                option.value = server.url;
                serverListDropdown.add(option);
            });
            serverListDropdown.addEventListener('change', (e)=>{
                const selectedOption = e.target.selectedOptions[0];
                const totallinks = selectedOption.dataset.totallinksl
                totalurls.textContent = `Total URLS: ${totallinks}`;
            })
            serverListDropdown.dispatchEvent(new Event('change'));
        })
        .catch(error => console.error('Error fetching server list:', error));

});


document.getElementById('startStopBtn').addEventListener('click', function() {
        console.log("Scanning Called");
        scanningPaused = false;
        scanningStarted = true;
        startScanning();
});


function startScanning() {
    // Start scanning
    document.getElementById("startStopBtn").setAttribute("disabled", "true");
    console.log("startScanning() - Fetching List...");
    fetch('server.txt')
        .then(response => response.text())
        .then(text => {
            const urls = text.trim().split('\n');
            totalUrls = urls.length;
            console.log("startScanning() - URLs Fetched!");
            console.log(urls);
            processUrlsSequentially(urls);
        })
        .catch(error => {
            console.error("startScanning() - Error fetching URL list:", error);
        });
}

function processUrlsSequentially(urls) {
    console.log("processUrlsSequentially() - URL Processor Called")
    const url = urls.shift();
    if (!scanningPaused && url) {
        console.log("Checking URL:", url.trim());
        document.getElementById('currentUrl').textContent = "Current URL: " + url.trim();
        checkUrl(url.trim())
            .then(() => {
                processUrlsSequentially(urls);
            });
    } else {
      console.log("Checking URL has been Stopped.")
    }
}


function checkUrl(url) {
    let timeOutValue = document.getElementById('timeOutValue').value * 1000;

    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const signal = controller.signal;

        setTimeout(() => {
            controller.abort();
        }, timeOutValue);

        console.log("Fetching URL:", url);
        fetch(url, { method: 'HEAD', mode: 'no-cors', signal })
            .then(response => {
                console.log("Response for", url, ":", response);
                setStatus(url, response.status, 'online');
                resolve();
            })
            .catch((error) => {
                console.error("Error fetching URL:", url, error);
                setStatus(url, 0, 'offline');
                resolve();
            });
    });
}

function setStatus(url, responseCode, status) {
    console.log("Setting status for URL:", url, "to", status);
    processedUrls++;
    const progress = Math.round((processedUrls / totalUrls) * 50);
    document.getElementById('progressValue').textContent = progress + "%";
    document.title = progress + "% - Scanning for BDIX Servers";

    setLoadingProgress(progress, 50);

    if(progress == 100){
        scanningStarted = false;
    }

    const listItem = document.createElement('li');

    if (status === 'online') {
        listItem.classList.add('online');
        listItem.innerHTML = "<a target='_blank' href='" + url + "'>" + url + " (Online)</a>";
        document.getElementById('urlList').appendChild(listItem);
    } else {
        listItem.classList.add('offline');
        listItem.innerHTML = "<a target='_blank' href='" + url + "'>" + url + " (Offline)</a>";
        document.getElementById('urlList2').appendChild(listItem);
    }

    if (document.getElementById('autoscroll').checked) {
        const urlList = document.getElementById('urlList');
        const urlList2 = document.getElementById('urlList2');
        urlList.scrollTop = urlList.scrollHeight;
        urlList2.scrollTop = urlList2.scrollHeight;
    }
}

function resetScanning() {
    clearInterval(timerInterval);
    scanningPaused = true;
    document.getElementById('startStopBtn').textContent = 'Start';
    document.getElementById('elapsedTime').textContent = '00:00:00';
    elapsedTime = 0;
    processedUrls = 0;
    document.getElementById('progressValue').textContent = '0%';
    document.title = 'BDIXscannerWeb';
    document.getElementById("startStopBtn").removeAttribute("disabled");
    document.getElementById('currentUrl').textContent = '';
    document.getElementById('urlList').innerHTML = '';
    document.getElementById('urlList2').innerHTML = '';
}

function formatTime(time) {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return (
        String(hours).padStart(2, '0') +
        ':' +
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0')
    );
}
