let locationSimilarities = [];

function calculateLocationCorrelations() {
    let locations = plotData.locations;
    let measures = plotData.measures;
    let months = plotData.months;
    let data = plotData.data;
    let allLocationData = {};
    locations.forEach(location => {
        let singleLocationData = [];
        measures.forEach(measure => {
            months.forEach(month => {
                let key = "$" + measure + "_" + location + "_" + month;
                singleLocationData.push(data[key]?data[key].average: data[key]);
            });
        });
        allLocationData["$"+location] = singleLocationData;
    });
    //Now for each pair of locations we will remove the pair if the data is not available.
    for (let i = 0; i < locations.length-1; i++) {
        for (let j = i+1; j < locations.length; j++) {
            let location1 = locations[i];
            let location2 = locations[j];
            //Copy the data
            let location1Data = allLocationData["$"+location1].slice();
            let location2Data = allLocationData["$"+location2].slice();
            for (let k = 0; k < location1Data.length; k++) {
                //Remove the data element if neither one of them has data.
                if(!location1Data[k] || ! location2Data[k]){
                    location1Data.splice(k, 1);
                    location2Data.splice(k, 1);
                }
            }
            let corr = statistics.pearsonCorcoef(location1Data, location2Data);
            locationSimilarities.push(new Similarity(location1, location2, Math.abs(corr)));
        }
    }
}

let measureSimilarities = [];

function calculateMeasureCorrelations() {
    let locations = plotData.locations;
    let measures = plotData.measures;
    let months = plotData.months;
    let data = plotData.data;
    let allMeasureData = {};
    measures.forEach(measure => {
        let singleMeasureData = [];
        locations.forEach(location => {
            months.forEach(month => {
                let key = "$" + measure + "_" + location + "_" + month;
                singleMeasureData.push(data[key]?data[key].average: data[key]);
            });
        });
        allMeasureData["$"+measure] = singleMeasureData;
    });
    //Now for each pair of measures we will remove the pair if the data is not available.
    for (let i = 0; i < measures.length-1; i++) {
        for (let j = i+1; j < measures.length; j++) {
            let measure1 = measures[i];
            let measure2 = measures[j];
            //Copy the data
            let measure1Data = allMeasureData["$"+measure1].slice();
            let measure2Data = allMeasureData["$"+measure2].slice();
            for (let k = 0; k < measure1Data.length; k++) {
                //Remove the data element if either one of them has data.
                if(!measure1Data[k] || !measure2Data[k]){
                    measure1Data.splice(k, 1);
                    measure2Data.splice(k, 1);
                }
            }
            let corr = statistics.pearsonCorcoef(measure1Data, measure2Data);
            measureSimilarities.push(new Similarity(measure1, measure2,Math.abs(corr)));
        }
    }
}