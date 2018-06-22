let utils = {
    datediff: function (first, second) {
        return Math.round((second - first) / (1000 * 60 * 60 * 24));
    },
    monthdiff: function (d1, d2) {
        var months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months;
    },
    monthFormat(date) {
        let formatter = d3.timeFormat('%Y-%m');
        return formatter(date);
    }
};
let statistics = {
    normalBound: function (yValues) {
        if (yValues.length < 4)
            return [d3.min(yValues), d3.max(yValues)];

        let values, q1, q3, iqr, maxValue, minValue;

        values = yValues.slice().sort((a, b) => a - b);

        if ((values.length / 4) % 1 === 0) {//find quartiles
            q1 = 1 / 2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
            q3 = 1 / 2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
        } else {
            q1 = values[Math.floor(values.length / 4 + 1)];
            q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
        }

        iqr = q3 - q1;
        maxValue = q3 + iqr * 1.5;
        minValue = q1 - iqr * 1.5;

        return [minValue, maxValue];
    }
}
