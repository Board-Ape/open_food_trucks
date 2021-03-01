const apiUrl = 'https://data.sfgov.org/resource/jjew-r69b.json';
const fetch = require("node-fetch");
const Table = require('cli-table');
// commmand line table
const table = new Table({ 
    head: ['Name', 'Address'],
    colWidths: [75, 25]
});

// instantiation upon terminal command 'npm start' or 'node index.js'
findFoodTrucks();

async function findFoodTrucks() {
    const trucks = await fetchFoodTrucks(apiUrl);
    const filtered = filterFoodTrucks(trucks);
    const sorted = sortFoodTrucks(filtered);
    const limitInitialDisplay = 10;
    
    printFoodTrucks(sorted, limitInitialDisplay);
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
    }
};

function filterFoodTrucks(arr) {
    const time = dateNowPST();
    const hours = time.getHours();
    const day = time.getDay();

    return arr.filter((truck) => {
        if (parseInt(truck.dayorder) === day && 
            parseInt(truck.start24) <= hours &&
            parseInt(truck.end24) > hours
        ) {
            return truck;
        };
    });
};

function sortFoodTrucks(arr) {
    return arr.sort((a,b) => {
        if (a.applicant.toLowerCase() > b.applicant.toLowerCase()) return 1;
        if (a.applicant.toLowerCase() < b.applicant.toLowerCase()) return -1;
        return 0;
    });
};

function dateNowPST() {
    const timeUTC = new Date();
    // getTimezoneOffset compatibility may return 0
    // 480 represents the PST offset to UTC * 60 * 1000 = number of milliseconds
    const timePST = timeUTC.getTimezoneOffset() ? timeUTC.getTimezoneOffset() : 480*60*1000;
    const diff = timeUTC - timePST;
  
    return new Date(diff);
};
