/*
 * script.js
 * Máscaras, validações, submissão, estados UI, utilitários.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const submitButton = document.getElementById('submit-button');
    const alertArea = document.querySelector('.alert-area');
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const restricoesGroup = document.getElementById('restricoes-medicas-group');
    const restricoesTextarea = document.getElementById('restricoes');
    const termoAceite = document.getElementById('termo-aceite');

    // --- 1. Utilidades e Máscaras ---

    /**
     * Aplica a máscara de CPF (000.000.000-00)
     * @param {string} value
     * @returns {string}
     */
    const maskCPF = (value) => {
        value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
        value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o primeiro ponto
        value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o segundo ponto
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca o hífen
        return value;
    };

    /**
     * Aplica a máscara de Telefone ((00) 00000-0000)
     * @param {string} value
     * @returns {string}
     */
    const maskTelefone = (value) => {
        value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2"); // Coloca parênteses e espaço
        value = value.replace(/(\d)(\d{4})$/, "$1-$2"); // Coloca hífen
        return value;
    };

    // Aplica as máscaras nos campos
    document.getElementById('cpf').addEventListener('input', (e) => {
        e.target.value = maskCPF(e.target.value);
        validateField(e.target);
        updateProgressBar();
    });

    document.getElementById('telefone').addEventListener('input', (e) => {
        e.target.value = maskTelefone(e.target.value);
        validateField(e.target);
        updateProgressBar();
    });

    // --- 2. Validações ---

    /**
     * Valida o dígito verificador do CPF.
     * @param {string} cpf - CPF sem formatação.
     * @returns {boolean}
     */
    const validateCPFDigits = (cpf) => {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    };

    /**
     * Exibe ou oculta a mensagem de erro para um campo.
     * @param {HTMLElement} field - O campo do formulário.
     * @param {string} message - A mensagem de erro.
     */
    const displayError = (field, message) => {
        const errorElement = document.getElementById(field.id + '-error');
        if (message) {
            field.classList.add('is-invalid');
            errorElement.textContent = message;
            errorElement.setAttribute('aria-hidden', 'false');
        } else {
            field.classList.remove('is-invalid');
            errorElement.textContent = '';
            errorElement.setAttribute('aria-hidden', 'true');
        }
    };

    /**
     * Valida um campo específico.
     * @param {HTMLElement} field - O campo do formulário.
     * @returns {boolean} - true se válido, false caso contrário.
     */
    const validateField = (field) => {
        let errorMessage = '';
        const value = field.value.trim();

        if (field.required && !value) {
            errorMessage = 'Este campo é obrigatório.';
        } else if (field.id === 'cpf') {
            const unmaskedCPF = value.replace(/[^\d]+/g, '');
            if (unmaskedCPF.length !== 11) {
                errorMessage = 'O CPF deve ter 11 dígitos.';
            } else if (!validateCPFDigits(unmaskedCPF)) {
                errorMessage = 'CPF inválido. Verifique os dígitos.';
            }
        } else if (field.id === 'telefone') {
            const unmaskedTelefone = value.replace(/[^\d]+/g, '');
            if (unmaskedTelefone.length < 10) {
                errorMessage = 'Telefone inválido. Mínimo 10 dígitos (DDD + número).';
            }
        } else if (field.id === 'restricoes' && restricoesGroup.style.display !== 'none' && !value) {
            errorMessage = 'A descrição das restrições médicas é obrigatória.';
        } else if (field.type === 'checkbox' && field.required && !field.checked) {
            errorMessage = 'Você deve aceitar o termo de participação.';
        }

        displayError(field, errorMessage);
        return !errorMessage;
    };

    // Adiciona validação em tempo real para todos os campos
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            // Remove a classe de erro ao digitar para permitir correção
            if (field.classList.contains('is-invalid')) {
                validateField(field);
            }
            updateSubmitButtonState();
        });
    });

    // --- 3. Lógica de UI/UX ---

    /**
     * Controla a visibilidade do campo de restrições médicas.
     */
    const handleRestricoesVisibility = () => {
        const radioSim = document.getElementById('experiencia-sim');
        if (radioSim.checked) {
            restricoesGroup.style.display = 'block';
            restricoesTextarea.setAttribute('required', 'required');
        } else {
            restricoesGroup.style.display = 'none';
            restricoesTextarea.removeAttribute('required');
            displayError(restricoesTextarea, ''); // Limpa erro se houver
            restricoesTextarea.value = ''; // Limpa o valor
        }
        updateSubmitButtonState();
    };

    document.querySelectorAll('input[name="experiencia-brigada"]').forEach(radio => {
        radio.addEventListener('change', handleRestricoesVisibility);
    });

    /**
     * Atualiza o estado do botão de submissão (habilitado/desabilitado).
     */
    const updateSubmitButtonState = () => {
        const allRequiredFields = form.querySelectorAll('[required]');
        let allValid = true;

        allRequiredFields.forEach(field => {
            // Verifica se o campo está visível e se é válido
            if (field.type === 'radio') {
                const radioGroup = form.querySelector(`input[name="${field.name}"]:checked`);
                if (!radioGroup) {
                    allValid = false;
                }
            } else if (field.type === 'checkbox') {
                if (!field.checked) {
                    allValid = false;
                }
            } else if (field.closest('.form-group').style.display !== 'none') {
                if (!validateField(field)) {
                    allValid = false;
                }
            }
        });

        submitButton.disabled = !allValid;
    };

    // Inicializa o estado do botão e a visibilidade das restrições
    handleRestricoesVisibility();
    updateSubmitButtonState();
    termoAceite.addEventListener('change', updateSubmitButtonState);

    // --- 4. Barra de Progresso ---

    /**
     * Calcula e atualiza a barra de progresso.
     */
    const updateProgressBar = () => {
        const allFields = form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea');
        let filledFields = 0;
        let totalFields = 0;

        allFields.forEach(field => {
            if (field.closest('.form-group').style.display !== 'none') {
                totalFields++;
                if (field.value.trim() !== '') {
                    filledFields++;
                }
            }
        });

        // Adiciona os campos radio e checkbox obrigatórios
        const radioGroup = form.querySelector('input[name="experiencia-brigada"]:checked');
        if (radioGroup) filledFields++;
        totalFields++;

        if (termoAceite.checked) filledFields++;
        totalFields++;

        const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
        progressBarFill.style.width = `${percentage}%`;
        progressBarFill.parentElement.setAttribute('aria-valuenow', percentage);
    };

    // Atualiza a barra de progresso em qualquer interação
    form.addEventListener('input', updateProgressBar);
    form.addEventListener('change', updateProgressBar);
    updateProgressBar(); // Inicializa a barra

    // --- 5. Submissão do Formulário e Integração (Simulada) ---

    /**
     * Exibe uma mensagem de feedback (sucesso ou erro) na área de alerta.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - O tipo de mensagem ('success' ou 'error').
     */
    const showFeedback = (message, type) => {
        alertArea.textContent = message;
        alertArea.className = `alert-area ${type}`;
        alertArea.style.display = 'block';
        alertArea.focus(); // Foco para leitores de tela (aria-live)
        // Remove a mensagem após 10 segundos
        setTimeout(() => {
            alertArea.style.display = 'none';
            alertArea.textContent = '';
        }, 10000);
    };

    /**
     * Cria o payload JSON para a submissão.
     * @returns {object}
     */
    const createPayload = () => {
        const formData = new FormData(form);
        const data = {
            formId: "brigada-emergencia-v1",
            timestamp: new Date().toISOString(),
            source: "landing-dhl"
        };

        for (const [key, value] of formData.entries()) {
            // Ignora o checkbox de termo se não estiver marcado (embora o required garanta que esteja)
            if (key === 'termo-aceite') continue;

            // Limpa máscaras de CPF e Telefone
            if (key === 'cpf' || key === 'telefone') {
                data[key] = value.replace(/[^\d]+/g, '');
            } else {
                data[key] = value;
            }
        }

        // Adiciona o campo de restrições se estiver visível, mesmo que vazio (para consistência do payload)
        if (restricoesGroup.style.display === 'none') {
            data['restricoes'] = 'Não se aplica';
        }

        return data;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validação final antes de submeter
        let formValid = true;
        form.querySelectorAll('[required]').forEach(field => {
            if (!validateField(field)) {
                formValid = false;
            }
        });

        if (!formValid) {
            showFeedback('Por favor, corrija os erros no formulário antes de enviar.', 'error');
            return;
        }

        // Simulação de Submissão
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner"></span> Enviando...';

        const payload = createPayload();
        console.log('Payload JSON a ser enviado:', payload);

        // URL fictícia para simulação
        const apiUrl = 'https://api.exemplo.com/inscricoes';

        try {
            // Simulação de requisição fetch POST
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simula delay de rede

            // Simulação de sucesso
            const response = { ok: true, status: 201 };

            if (response.ok) {
                showFeedback('Inscrição recebida! Você receberá confirmação por e-mail.', 'success');
                form.reset(); // Limpa o formulário
                handleRestricoesVisibility(); // Reseta a visibilidade
                updateProgressBar(); // Reseta a barra
                updateSubmitButtonState(); // Reseta o botão
            } else {
                // Simulação de erro no servidor
                throw new Error('Erro ao processar a inscrição. Tente novamente.');
            }

        } catch (error) {
            console.error('Erro na submissão:', error);
            showFeedback('Erro amigável: Não foi possível completar a inscrição. Por favor, tente novamente mais tarde.', 'error');
        } finally {
            submitButton.innerHTML = 'Enviar Inscrição';
            submitButton.disabled = false;
        }
    });

    // --- 6. Prevenção de XSS Básico (Simulado) ---
    // Em um ambiente real, a prevenção de XSS deve ser feita principalmente no lado do servidor.
    // No lado do cliente, a normalização de entrada é uma boa prática.
    form.querySelectorAll('input[type="text"], textarea').forEach(field => {
        field.addEventListener('input', (e) => {
            // Normaliza a entrada para remover caracteres potencialmente perigosos
            e.target.value = e.target.value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
            e.target.value = e.target.value.replace(/<[^>]*>?/gm, "");
        });
    });

    // --- 7. Navegação por Teclado (Foco Visível já tratado no CSS) ---
    // O foco visível está garantido no CSS com o outline/box-shadow.
    // A navegação sequencial é nativa do HTML.

    // --- 8. Reset do Formulário ---
    form.addEventListener('reset', () => {
        // Garante que o estado de erro seja limpo
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.setAttribute('aria-hidden', 'true');
        });
        // Reseta a visibilidade das restrições
        setTimeout(() => {
            handleRestricoesVisibility();
            updateProgressBar();
            updateSubmitButtonState();
            alertArea.style.display = 'none';
        }, 50); // Pequeno delay para garantir que o reset nativo ocorra primeiro
    });
});
