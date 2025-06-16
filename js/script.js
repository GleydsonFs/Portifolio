let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x')
    navbar.classList.toggle('active');
}

// Funcionalidade de envio de e-mail
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Obter dados do formulário
        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            assunto: document.getElementById('assunto').value,
            mensagem: document.getElementById('mensagem').value
        };
        
        // Botão de envio
        const submitBtn = contactForm.querySelector('.btn');
        const originalText = submitBtn.textContent;
        
        try {
            // Mostrar loading
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            
            // Enviar dados para o backend
            const response = await fetch('http://localhost:5000/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('E-mail enviado com sucesso! Obrigado pelo contato.');
                contactForm.reset();
            } else {
                alert('Erro ao enviar e-mail: ' + result.message);
            }
            
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao enviar e-mail. Verifique se o servidor está rodando.');
        } finally {
            // Restaurar botão
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

class FormSubmit {
    constructor(settings) {
        this.settings = settings;
        this.form = document.querySelector(settings.form);
        this.formButton = document.querySelector(settings.button);
        if (this.form) {
            this.url = this.form.getAttribute("action");
        }
    }

    
    displaySucess() {
        this.form.innerHTML = this.settings.sucess;
    }

    displayError() {
        this.form.innerHTML = this.settings.error;
    }

    init() {
        if (this.form) this.formButton.addEvenListener("click", () => this.displaySucess());
        return this;
    }
}

const formSubmit = new FormSubmit({});

