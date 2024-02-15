
document.getElementById('calculatorForm').addEventListener('submit', function(event) {
  event.preventDefault();
  // Extract and validate inputs
  if (!validateFormInputs()) return;

  let inputs = extractInputs();
  convertUnits(inputs);
  convertStringInputsToValues(inputs);
  performCalculations(inputs);
});

document.getElementById('desiredOutput').addEventListener('change', adjustAdditionalInputField);

function validateFormInputs() {
  let inputs = document.querySelectorAll("#calculatorForm input");
  for (let input of inputs) {
      if (!input.value) {
          alert(`Please fill in the ${input.name} field.`);
          return false;
      }
  }
  return true;
}

function extractInputs() {
  return {
      startDate: document.getElementById('startDate').value,
      startWeight: parseFloat(document.getElementById('weight').value),
      height: parseFloat(document.getElementById('height').value),
      age: parseInt(document.getElementById('age').value),
      gender: document.getElementById('gender').value,
      activityLevel: document.getElementById('activityLevel').value,
      caloricIntake: parseFloat(document.getElementById('caloricIntake').value),
      desiredOutput: document.getElementById('desiredOutput').value,
      additionalInput: document.getElementById('additionalInputField') ? document.getElementById('additionalInputField').value : null,
      unitSelectionWeight: document.getElementById('unitSelectionWeight').value,
      unitSelectionHeight: document.getElementById('unitSelectionHeight').value,
      outputDisplayArea: document.getElementById('outputDisplayArea'),
      additionalInput: document.getElementById('additionalInputField') ? document.getElementById('additionalInputField').value : null,
      exportInterval: document.getElementById('exportInterval') ? document.getElementById('exportInterval').value : 'daily',

  };
}

function convertUnits(inputs) {
  if (inputs.unitSelectionWeight === "metric") {
      inputs.startWeight *= 2.205;
  }
  if (inputs.unitSelectionHeight === "metric") {
      inputs.height /= 2.54;
  }
}

function convertStringInputsToValues(inputs) {
  inputs.gender = inputs.gender === "male" ? 0 : 1;

  const activityLevels = {
      'sedentary': 1.2,
      'lightly': 1.375,
      'moderately': 1.55,
      'very': 1.725,
      'super': 1.9
  };

  inputs.activityLevel = activityLevels[inputs.activityLevel] || 1.2;
}

function performCalculations(inputs) {
  let bmr = calculateBMR(inputs.startWeight, inputs.height, inputs.age, inputs.gender);
  let tdee = bmr * inputs.activityLevel;
  let startBmi = calculateBMI(inputs.startWeight, inputs.height);
  let caloricDeficit = inputs.caloricIntake - tdee;
  let dailyWeightChange = caloricDeficit / 3500;
  
  switch (inputs.desiredOutput) {
    case "date":
      displayPredictedWeightOnDate(inputs);
        break;
    case "bmi":
        displayDateForTargetBMI(inputs);
        break;
    case "weight":
        displayDateForTargetWeight(inputs);
        break;
    case "weightLoss":
          displayDateForDesiredWeightLoss(inputs);
          break;
    case "table":
      let tableData = generateData(inputs);
      renderTable(tableData, inputs.outputDisplayArea);
      break;      
    case "export":
        let data = generateData(inputs);
        exportToCSV(data);
        break;
      default:
          console.error("Invalid desired output.");
  }
}

function getBMIClass(bmi) {
  if (bmi < 18.5) {
      return "Underweight";
  } else if (bmi >= 18.5 && bmi < 25) {
      return "Healthy Weight";
  } else if (bmi >= 25 && bmi < 30) {
      return "Overweight";
  } else if (bmi >= 30 && bmi < 35) {
      return "Obese Class 1";
  } else if (bmi >= 35 && bmi < 40) {
      return "Obese Class 2";
  } else {
      return "Obese Class 3 (Severe Obesity)";
  }
}

function calculateBMR(weight, height, age, gender) {
  if (gender === 0) {
      return 66.47 + (6.24 * weight) + (12.7 * height) - (6.755 * age);
  } else {
      return 655.1 + (4.35 * weight) + (4.7 * height) - (4.676 * age);
  }
}

function calculateBMI(weight, height) {
  if (typeof weight !== "number" || typeof height !== "number" || isNaN(weight) || isNaN(height) || height === 0) {
      console.error('Invalid inputs to calculateBMI:', weight, height);
      return NaN;
  }
  return (weight / (height ** 2)) * 703;
}


function calculateDaysDifference(startDate, targetDate) {
  let startDateTime = new Date(startDate);
  let targetDateTime = new Date(targetDate);
  let differenceInTime = targetDateTime.getTime() - startDateTime.getTime();
  return differenceInTime / (1000 * 3600 * 24);
}

function addDaysToDate(date, days) {
  let resultDate = new Date(date);
  resultDate.setDate(resultDate.getDate() + days);
  return resultDate.toISOString().slice(0, 10);
}

function displayPredictedWeightOnDate(inputs) {
  let daysDifference = calculateDaysDifference(inputs.startDate, inputs.additionalInput);
  let currentWeight = inputs.startWeight;

  for (let i = 0; i < daysDifference; i++) {
      let currentBMR = calculateBMR(currentWeight, inputs.height, inputs.age, inputs.gender);
      let currentTDEE = currentBMR * inputs.activityLevel;
      let caloricDeficit = inputs.caloricIntake - currentTDEE;
      let dailyWeightChange = caloricDeficit / 3500;
      currentWeight += dailyWeightChange;
  }

  let predictedBmi = calculateBMI(currentWeight, inputs.height);
  if (isNaN(predictedBmi)) {
      console.error("Predicted BMI calculation resulted in an invalid value:", predictedBmi);
      console.error("Current Weight:", currentWeight);
      console.error("Height:", inputs.height);
      return;
  }
  let predictedBMIClass = getBMIClass(predictedBmi);
  inputs.outputDisplayArea.innerHTML = `Predicted Weight on ${inputs.additionalInput}: ${currentWeight.toFixed(2)} lbs<br>Predicted BMI on ${inputs.additionalInput}: ${predictedBmi.toFixed(2)}<br>BMIClass: ${predictedBMIClass}`;
}

function displayDateForTargetBMI(inputs) {
  let currentDate = new Date(inputs.startDate);
  let currentWeight = inputs.startWeight;

  while (calculateBMI(currentWeight, inputs.height) < parseFloat(inputs.additionalInput)) {
      let currentBMR = calculateBMR(currentWeight, inputs.height, inputs.age, inputs.gender);
      let currentTDEE = currentBMR * inputs.activityLevel;
      let caloricDeficit = inputs.caloricIntake - currentTDEE;
      let dailyWeightChange = caloricDeficit / 3500;
      currentWeight += dailyWeightChange;
      currentDate.setDate(currentDate.getDate() + 1);
  }

  let targetDate = currentDate.toISOString().slice(0, 10);
  let targetBMIClass = getBMIClass(parseFloat(inputs.additionalInput));
  inputs.outputDisplayArea.innerHTML = `Predicted Date to Reach BMI of ${inputs.additionalInput}: ${targetDate}<br>Associated Weight: ${currentWeight.toFixed(2)} lbs<br>BMIClass: ${targetBMIClass}`;
}

function displayDateForTargetWeight(inputs) {
  let currentDate = new Date(inputs.startDate);
  let currentWeight = inputs.startWeight;

  while (currentWeight > parseFloat(inputs.additionalInput)) {
      let currentBMR = calculateBMR(currentWeight, inputs.height, inputs.age, inputs.gender);
      let currentTDEE = currentBMR * inputs.activityLevel;
      let caloricDeficit = inputs.caloricIntake - currentTDEE;
      let dailyWeightChange = caloricDeficit / 3500;
      currentWeight += dailyWeightChange;
      currentDate.setDate(currentDate.getDate() + 1);
  }

  let targetDate = currentDate.toISOString().slice(0, 10);
  let targetBmi = calculateBMI(parseFloat(inputs.additionalInput), inputs.height);
  let targetBMIClass = getBMIClass(targetBmi);
  inputs.outputDisplayArea.innerHTML = `Predicted Date to Reach Weight of ${inputs.additionalInput} lbs: ${targetDate}<br>Associated BMI: ${targetBmi.toFixed(2)}<br>BMIClass: ${targetBMIClass}`;
}

function generateData(inputs) {
  let data = [];
  let currentDate = new Date(inputs.startDate);
  let currentWeight = inputs.startWeight;
  let interval = inputs.exportInterval === 'weekly' ? 7 : 1; 
  let daysSinceLastExport = 0;  // New counter

  while (currentDate <= new Date(inputs.additionalInput)) {
      let currentBMR = calculateBMR(currentWeight, inputs.height, inputs.age, inputs.gender);
      let currentTDEE = currentBMR * inputs.activityLevel;
      let caloricDeficit = inputs.caloricIntake - currentTDEE;
      let dailyWeightChange = caloricDeficit / 3500;
      currentWeight += dailyWeightChange;

      daysSinceLastExport++; // Increase the counter

      if (daysSinceLastExport === interval) {
          let currentBMI = calculateBMI(currentWeight, inputs.height);
          let currentBMIClass = getBMIClass(currentBMI);

          data.push({
              date: currentDate.toISOString().slice(0, 10),
              weight: currentWeight.toFixed(2),
              bmi: currentBMI.toFixed(2),
              bmiClass: currentBMIClass,
              bmr: currentBMR.toFixed(2),
              tdee: currentTDEE.toFixed(2)
          });

          daysSinceLastExport = 0; // Reset the counter
      }

      currentDate.setDate(currentDate.getDate() + 1); 
  }

  return data;
}

function displayDateForDesiredWeightLoss(inputs) {
  let startDate = new Date(inputs.startDate);
  let currentDate = new Date(inputs.startDate);
  let currentWeight = inputs.startWeight;
  let targetWeight = currentWeight - parseFloat(inputs.additionalInput);
  let daysRequired = 0;

  while (currentWeight > targetWeight) {
      let currentBMR = calculateBMR(currentWeight, inputs.height, inputs.age, inputs.gender);
      let currentTDEE = currentBMR * inputs.activityLevel;
      let caloricDeficit = inputs.caloricIntake - currentTDEE;
      let dailyWeightChange = caloricDeficit / 3500;
      currentWeight += dailyWeightChange;
      currentDate.setDate(currentDate.getDate() + 1);
      daysRequired++;
  }

  let targetDate = currentDate.toISOString().slice(0, 10);
  let targetBmi = calculateBMI(currentWeight, inputs.height);
  let targetBMIClass = getBMIClass(targetBmi);
  inputs.outputDisplayArea.innerHTML = `Predicted Date to Lose ${inputs.additionalInput} lbs: ${targetDate}<br>Days Required: ${daysRequired}<br>Weight after Loss: ${currentWeight.toFixed(2)} lbs<br>Associated BMI: ${targetBmi.toFixed(2)}<br>BMIClass: ${targetBMIClass}`;
}

function renderTable(data, outputElement) {
  let tableHTML = '<table border="1" cellpadding="5" cellspacing="0">';
  tableHTML += '<thead><tr><th>Date</th><th>Weight</th><th>BMI</th><th>BMIClass</th></tr></thead><tbody>';

  for (let entry of data) {
      tableHTML += `<tr>
                      <td>${entry.date}</td>
                      <td>${entry.weight} lbs</td>
                      <td>${entry.bmi}</td>
                      <td>${entry.bmiClass}</td>
                    </tr>`;
  }

  tableHTML += '</tbody></table>';
  outputElement.innerHTML = tableHTML;
}

function adjustAdditionalInputField() {
  let desiredOutput = document.getElementById('desiredOutput').value;
  let additionalInputDiv = document.getElementById('additionalInputContent');

  switch (desiredOutput) {
      case 'date':
          additionalInputDiv.innerHTML = '<label for="additionalInputField">Target Date:</label><input type="date" id="additionalInputField" required>';
          break;
      case 'bmi':
          additionalInputDiv.innerHTML = '<label for="additionalInputField">Target BMI:</label><input type="number" id="additionalInputField" required>';
          break;
      case 'weight':
          additionalInputDiv.innerHTML = '<label for="additionalInputField">Target Weight:</label><input type="number" id="additionalInputField" required>';
          break;
      case 'weightLoss':
            additionalInputDiv.innerHTML = '<label for="additionalInputField">Target Weight Loss (lbs):</label><input type="number" id="additionalInputField" required>';
            break; 
      case 'table':
            additionalInputDiv.innerHTML = `
            <label for="additionalInputField">End Date:</label>
            <input type="date" id="additionalInputField" required>
            <label for="exportInterval">Display Interval:</label>
            <select id="exportInterval">
            <option value="daily" selected>Daily</option>
            <option value="weekly">Weekly</option>
            </select>`;
            break;  
      case 'export':
        additionalInputDiv.innerHTML = `
        <label for="additionalInputField">End Date:</label>
        <input type="date" id="additionalInputField" required>
        <label for="exportInterval">Display Interval:</label>
        <select id="exportInterval">
        <option value="daily" selected>Daily</option>
        <option value="weekly">Weekly</option>
        </select>`;
        break;        
      default:
          additionalInputDiv.innerHTML = '';
  }
}

function exportToCSV(data) {
  let csv = 'Date,Weight,BMI,BMIClass\n';
  for (let entry of data) {
      csv += `${entry.date},${entry.weight},${entry.bmi},${entry.bmiClass}\n`;
  }

  let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.style.display = "none";
  link.download = "predicted_data.csv";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}