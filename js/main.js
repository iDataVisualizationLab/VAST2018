$(document).ready(()=>{
    myDataProcessor.readData("mc2/Boonsong Lekagul waterways readings.csv");
});
function populateComboBox(selectId, options){
    let select = document.getElementById(selectId);
    options.forEach(opt=>{
       let el = document.createElement("option");
       el.value = opt;
       el.textContent = opt;
       select.appendChild(el);
    });
}
function plotScatter(){

}