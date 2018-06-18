let myDataProcessor = {
    data: null, //used to store the read data.
    readData: function (fileName) {
        d3.csv(fileName, function (error, rawData) {
            if (error) throw error;
            myDataProcessor.data = rawData;
            //Get the locations
            let location = rawData.map(d => {
                return d["location"];
            });
            //Now get the unique locations
            let uniqueLocations = d3.set(location).values();
            uniqueLocations.sort((a, b) => a.localeCompare(b));
            populateComboBox("locations", uniqueLocations);
            //Now get the unique chemical elements
            let measure = rawData.map(d=>{
                return d["measure"];
            });
            let uniqueMeasures = d3.set(measure).values();
            uniqueMeasures.sort((a, b) => a.localeCompare(b));
            populateComboBox("measures", uniqueMeasures);
        });
    }
};
