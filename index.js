
const fetch = require("node-fetch");
const Table = require('cli-table');

// commmand line table
const table = new Table({ 
    head: ['Name', 'Address'],
    colWidths: [75, 25]
});
// retrieve Pacific Standard Time (PST) date object 
const time = dateNowPST();

// invoke upon terminal command 'npm start' or 'node index.js'
findFoodTrucks();

async function findFoodTrucks() {
    const day = time.getDay();
    // filter by day and sort by applicant name using the SODA API
    const url = `https://data.sfgov.org/resource/jjew-r69b.json?dayorder=${day}&$order=applicant`;
    const trucks = await fetchFoodTrucks(url);
    const filtered = filterFoodTrucks(trucks);
    const limitInitialDisplay = 10;
    
    printFoodTrucks(filtered, limitInitialDisplay);
};

async function fetchFoodTrucks(url) {
    try {
        const response = await fetch(url);
        const foodTrucks = await response.json();

        return foodTrucks;
    } catch (error) {
        console.log(`Fetch failed: ${error}`);
    };
};

function printFoodTrucks(arr, displayCount) {
    if (!arr.length) {
        console.log('Sorry, no open food trucks.');
        process.exit();
    }

    let count;
    // populate table 
    for(count = 0; count < Math.min(arr.length, displayCount); count++) {
        table.push([ arr[count].applicant, arr[count].location ]);
    };

    // output initial table
    console.log(table.toString());

    if (arr.length > displayCount) {
        // ask user for a response
        process.stdout.write('Type "Y/N" for more results and press "Enter"');
        // process user response
        process.stdin.on('data', (data) => {
            const formatData = data.toString().trim().toLowerCase();

            if (formatData === 'y') {
                // reset table
                for (let i = 0; i < displayCount; i++) table.pop();

                // determine whether to iterate the remaining array length or display count
                let smallerLength = Math.min(arr.length, count + displayCount);

                // populate table 
                for (count; count < smallerLength; count++) {
                    table.push([ arr[count].applicant, arr[count].location ]);
                };

                // output new table
                console.log(table.toString());

                // exit if no more results exist
                if (count >= arr.length) {
                    console.log('No more results');
                    process.exit();
                }

                // repeat if more results exist
                process.stdout.write('Type "Y/N" for more results and press "Enter"');
            } else if (formatData === 'n') {
                process.exit();
            } else {
                // user input is a forced choice of 'y' or 'n'
                console.log('Invalid input: Type "Y" for more results or "N" to exit. Then press "Enter"');
            }
        });
    } else {
        console.log('No more results');
    };
};

function filterFoodTrucks(arr) {
    const hours = time.getHours() === 1 ? `0${time.getHours()}` : time.getHours();
    const minutes = time.getMinutes() === 1 ? `0${time.getMinutes()}` : time.getMinutes();
    const militaryTime = `${hours}:${minutes}`;
    
    return arr.filter((truck) => {
        // open 24 hours 
        if (truck.start24 === truck.end24) return truck;
        // open through the night and current hours is a single digit
        if (truck.start24 > truck.end24 && hours[0] === '0' && truck.end24 > militaryTime) return truck;
        // open through the night and current hours is two digits
        if (truck.start24 > truck.end24 && hours[0] !== '0' && truck.start24 < militaryTime) return truck;
        // open during the day
        if (truck.start24 < truck.end24 && truck.start24 < militaryTime && truck.end24 > militaryTime) return truck;
    })
};

function dateNowPST() {
    const timeUTC = new Date();
    // getTimezoneOffset compatibility may return 0
    // 480 represents the PST offset to UTC * 60 * 1000 = number of milliseconds
    const timePST = timeUTC.getTimezoneOffset() ? timeUTC.getTimezoneOffset() : 480*60*1000;
    const diff = timeUTC - timePST;
  
    return new Date(diff);
};
