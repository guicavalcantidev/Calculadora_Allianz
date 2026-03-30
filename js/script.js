const elements = {
    premio: document.getElementById('premio'),
    capA: document.getElementById('capA'),
    capC: document.getElementById('capC'),
    btnCalcular: document.getElementById('btnCalcular'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    resSaldo: document.getElementById('resSaldo'),
    resPel: document.getElementById('resPel'),
    resPremioCC: document.getElementById('resPremioCC'),
    resPremioLiquido: document.getElementById('resPremioLiquido'),
    historyList: document.getElementById('historyList')
};

const formatter = {
    currency: (val) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(val),

    parseLocaleFloat: (string) => {
        if (!string) return 0;
        return parseFloat(string.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    },

    formatInputCurrency: (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = (value / 100).toFixed(2) + '';
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = value ? 'R$ ' + value : '';
    }
};

const calculator = {
    parsePercent: (val) => {
        let v = parseFloat(val?.toString().replace(',', '.')) || 0;
        if (v >= 1) v = v / 100;
        return Math.max(0, Math.min(v, 0.9999));
    },

    calculate: () => {
        const premioTotal = formatter.parseLocaleFloat(elements.premio.value);

        if (premioTotal <= 0) {
            alert("Insira um valor válido para o Prêmio Total.");
            return null;
        }

        const p = premioTotal / 1.0738;
        const ca = calculator.parsePercent(elements.capA.value);
        const cc = calculator.parsePercent(elements.capC.value);

        const pelAplic = p / (1 - ca);
        const premioCC = pelAplic * (1 - cc);
        const saldo = p - premioCC;

        return {
            premioTotal,
            premio: p,
            capA: ca,
            capC: cc,
            pelAplic,
            premioCC,
            saldo,
            timestamp: new Date().toLocaleString('pt-BR')
        };
    }
};

const historyManager = {
    STORAGE_KEY: 'calc_cap_history',

    get: () => JSON.parse(localStorage.getItem(historyManager.STORAGE_KEY) || '[]'),

    save: (data) => {
        const history = historyManager.get();
        history.unshift(data);
        localStorage.setItem(historyManager.STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
        historyManager.render();
    },

    clear: () => {
        if (confirm("Limpar histórico?")) {
            localStorage.removeItem(historyManager.STORAGE_KEY);
            historyManager.render();
        }
    },

    render: () => {
        const history = historyManager.get();
        
        if (history.length === 0) {
            elements.historyList.innerHTML = '<div class="empty-state">Nenhum cálculo realizado ainda.</div>';
            return;
        }

        elements.historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-date">${item.timestamp}</div>
                <div class="history-grid">
                    <div><span class="subtitle">Prêmio:</span> ${formatter.currency(item.premio)}</div>
                    <div><span class="subtitle">Saldo:</span> <strong class="${item.saldo >= 0 ? 'value-pos' : 'value-neg'}">${formatter.currency(item.saldo)}</strong></div>
                    <div><span class="subtitle">CAP A/C:</span> <strong>${(item.capA * 100).toFixed(1)}% / ${(item.capC * 100).toFixed(1)}% </strong></div>
                </div>
            </div>
        `).join('');
    }
};

const init = () => {
    elements.premio.addEventListener('input', formatter.formatInputCurrency);

    elements.btnCalcular.addEventListener('click', () => {
        const result = calculator.calculate();
        if (!result) return;

        // Atualização dos valores na tela
        elements.resSaldo.textContent = formatter.currency(result.saldo);
        elements.resPel.textContent = formatter.currency(result.pelAplic);
        elements.resPremioCC.textContent = formatter.currency(result.premioCC);
        elements.resPremioLiquido.textContent = formatter.currency(result.premio);

        // --- LÓGICA DE CORES DINÂMICAS ---
        // Limpa as classes anteriores
        elements.resSaldo.classList.remove('text-positive', 'text-negative');
        
        // Aplica a nova classe baseada no resultado
        if (result.saldo < 0) {
            elements.resSaldo.classList.add('text-negative');
        } else if (result.saldo > 0) {
            elements.resSaldo.classList.add('text-positive');
        }

        historyManager.save(result);
    });

    elements.btnClearHistory.addEventListener('click', historyManager.clear);

    historyManager.render();
};

document.addEventListener('DOMContentLoaded', init);