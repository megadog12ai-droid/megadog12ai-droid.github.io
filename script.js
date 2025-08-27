document.addEventListener('DOMContentLoaded', () => {
    let formCounter = 0;

    const scaffoldingForms = document.getElementById('scaffolding-forms');
    const addScaffoldingBtn = document.getElementById('add-scaffolding');
    const calculateBtn = document.getElementById('calculate-btn');
    const totalResultsDiv = document.getElementById('total-results');
    const totalKenDiv = document.getElementById('total-ken');
    const pipeCombinationsDetails = document.getElementById('pipe-combinations-details');
    const combinationDetailsList = document.getElementById('combination-details-list');

    const pipeLengths = [4, 2.5, 2, 1.5, 1];

    function addScaffoldingForm() {
        formCounter++;
        const newForm = document.createElement('div');
        newForm.classList.add('scaffolding-form');
        newForm.innerHTML = `
            <button class="remove-btn">削除</button>
            <div class="input-group">
                <label for="length-${formCounter}">足場の長さ</label>
                <div class="input-unit-toggle">
                    <input type="number" id="length-${formCounter}" class="length-input" step="0.5" placeholder="例: 5.4">
                    <select class="unit-select">
                        <option value="meter">m</option>
                        <option value="ken">間</option>
                    </select>
                </div>
            </div>
            <div class="input-group">
                <label for="height-${formCounter}">足場の高さ (m)</label>
                <input type="number" id="height-${formCounter}" class="height-input" step="0.5" placeholder="例: 8.0">
            </div>
            <div class="input-group">
                <label>設置場所</label>
                <div class="radio-group">
                    <input type="radio" id="location-concrete-${formCounter}" name="location-${formCounter}" value="concrete" checked>
                    <label for="location-concrete-${formCounter}">コンクリート</label>
                    <input type="radio" id="location-soil-${formCounter}" name="location-${formCounter}" value="soil">
                    <label for="location-soil-${formCounter}">土の地面</label>
                </div>
            </div>
        `;
        scaffoldingForms.appendChild(newForm);
        updateRemoveButtons();
    }

    function updateRemoveButtons() {
        const forms = document.querySelectorAll('.scaffolding-form');
        forms.forEach((form, index) => {
            const removeBtn = form.querySelector('.remove-btn');
            if (forms.length > 1) {
                removeBtn.style.display = 'block';
                removeBtn.onclick = () => {
                    form.remove();
                    updateRemoveButtons();
                };
            } else {
                removeBtn.style.display = 'none';
            }
        });
    }

    function calculateMaterials() {
        let totalPipes = {};
        let totalPerpendicularClamps = 0;
        let totalJoints = 0;
        let totalStakes = 0;
        let totalFreeClamps = 0;
        let totalBases = 0;
        let totalLengthInMeters = 0;
        
        pipeLengths.forEach(len => totalPipes[len] = 0);
        
        combinationDetailsList.innerHTML = '';
        pipeCombinationsDetails.style.display = 'none';

        const forms = document.querySelectorAll('.scaffolding-form');

        forms.forEach((form, index) => {
            const lengthInput = form.querySelector('.length-input');
            const heightInput = form.querySelector('.height-input');
            const unitSelect = form.querySelector('.unit-select');
            const location = form.querySelector('input[name^="location-"]:checked').value;

            let length = parseFloat(lengthInput.value);
            const height = parseFloat(heightInput.value);

            if (isNaN(length) || isNaN(height) || length <= 0 || height <= 0) {
                return; // 無効な入力をスキップ
            }

            if (unitSelect.value === 'ken') {
                length *= 1.8;
            }

            totalLengthInMeters += length;

            // 支柱（縦）の本数計算
            const numVerticalPipes = Math.ceil(length / 1.8) + 1;
            const numVerticalLevels = Math.ceil(height / 1.8);
            const requiredHeightPipe = pipeLengths.find(len => len >= height) || pipeLengths[0];
            totalPipes[requiredHeightPipe] += numVerticalPipes;

            // 横パイプの計算と組み合わせ詳細
            const numHorizontalLevels = Math.ceil(height / 1.8);
            const horizontalPipesNeeded = numHorizontalLevels * numVerticalPipes;
            
            let combinationHtml = `<h4>足場 #${index + 1} の横パイプの組み合わせ</h4>`;
            
            for (let i = 0; i < numHorizontalLevels; i++) {
                let remainingLength = length;
                const combination = {};
                let combinationLength = 0;

                while (combinationLength < length + 0.1) { // 10cm以上の余りを確保
                    const selectedPipe = pipeLengths.find(len => (length - combinationLength) + 0.1 <= len) || pipeLengths.find(len => remainingLength >= len) || pipeLengths[pipeLengths.length - 1];
                    
                    if (combination[selectedPipe]) {
                        combination[selectedPipe]++;
                    } else {
                        combination[selectedPipe] = 1;
                    }
                    totalPipes[selectedPipe]++;
                    combinationLength += selectedPipe;
                    remainingLength -= selectedPipe;
                }
                
                let combinationString = '';
                for (const len in combination) {
                    combinationString += `${len}mパイプ: ${combination[len]}本, `;
                }
                combinationHtml += `<div class="combination-item"><p>横パイプ 段目 ${i + 1}: ${combinationString.slice(0, -2)}</p></div>`;
            }
            combinationDetailsList.innerHTML += combinationHtml;
            pipeCombinationsDetails.style.display = 'block';

            // 直交クランプの計算
            totalPerpendicularClamps += numVerticalPipes * numHorizontalLevels;

            // ジョイントの計算
            const numVerticalJoints = (numVerticalLevels) * numVerticalPipes;
            const numHorizontalJoints = Math.ceil(length / 1.8) * numHorizontalLevels;
            totalJoints += numVerticalJoints + numHorizontalJoints;

            // 設置場所別資材の計算
            if (location === 'soil') {
                totalStakes += numVerticalPipes;
                totalFreeClamps += numVerticalPipes * 2;
            } else if (location === 'concrete') {
                totalBases += numVerticalPipes;
            }
        });

        displayResults(totalPipes, totalPerpendicularClamps, totalJoints, totalStakes, totalFreeClamps, totalBases, totalLengthInMeters);
    }

    function displayResults(pipes, perpendicularClamps, joints, stakes, freeClamps, bases, totalMeters) {
        totalResultsDiv.innerHTML = '';
        
        let resultsHtml = '';
        
        resultsHtml += `
            <div class="result-item">
                <h4>直交クランプ</h4>
                <p>${perpendicularClamps} 個</p>
            </div>
        `;
        resultsHtml += `
            <div class="result-item">
                <h4>ジョイント</h4>
                <p>${joints} 個</p>
            </div>
        `;
        
        for (const len of pipeLengths) {
            if (pipes[len] > 0) {
                resultsHtml += `
                    <div class="result-item">
                        <h4>単管パイプ (${len}m)</h4>
                        <p>${pipes[len]} 本</p>
                    </div>
                `;
            }
        }
        
        if (stakes > 0) {
            resultsHtml += `
                <div class="result-item">
                    <h4>杭</h4>
                    <p>${stakes} 本</p>
                </div>
            `;
            resultsHtml += `
                <div class="result-item">
                    <h4>自在クランプ</h4>
                    <p>${freeClamps} 個</p>
                </div>
            `;
        }
        
        if (bases > 0) {
            resultsHtml += `
                <div class="result-item">
                    <h4>ベース</h4>
                    <p>${bases} 個</p>
                </div>
            `;
        }

        totalResultsDiv.innerHTML = resultsHtml;
        totalKenDiv.innerHTML = `<p>${(totalMeters / 1.8).toFixed(2)} 間</p>`;
    }

    addScaffoldingBtn.addEventListener('click', addScaffoldingForm);
    calculateBtn.addEventListener('click', calculateMaterials);
    updateRemoveButtons();
});
