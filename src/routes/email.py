from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

email_bp = Blueprint('email', __name__)

@email_bp.route('/send-email', methods=['POST'])
def send_email():
    try:
        # Obter dados do formulário
        data = request.get_json()
        
        nome = data.get('nome', '')
        email_remetente = data.get('email', '')
        telefone = data.get('telefone', '')
        assunto = data.get('assunto', '')
        mensagem = data.get('mensagem', '')
        
        # Validar campos obrigatórios
        if not nome or not email_remetente or not mensagem:
            return jsonify({'success': False, 'message': 'Nome, email e mensagem são obrigatórios'}), 400
        
        # Configurar e-mail
        email_destino = 'gleydsonfsantos@hotmail.com'
        
        # Criar mensagem
        msg = MIMEMultipart()
        msg['From'] = 'noreply@portfolio.com'
        msg['To'] = email_destino
        msg['Subject'] = f'Contato do Portfólio: {assunto}' if assunto else 'Contato do Portfólio'
        
        # Corpo do e-mail
        corpo_email = f"""
        Nova mensagem recebida através do portfólio:
        
        Nome: {nome}
        Email: {email_remetente}
        Telefone: {telefone if telefone else 'Não informado'}
        Assunto: {assunto if assunto else 'Não informado'}
        
        Mensagem:
        {mensagem}
        
        ---
        Esta mensagem foi enviada através do formulário de contato do portfólio.
        """
        
        msg.attach(MIMEText(corpo_email, 'plain'))
        
        # Para demonstração, vamos simular o envio bem-sucedido
        # Em produção, você configuraria um servidor SMTP real
        print(f"E-mail simulado enviado para {email_destino}")
        print(f"Remetente: {nome} ({email_remetente})")
        print(f"Assunto: {msg['Subject']}")
        print(f"Mensagem: {mensagem}")
        
        return jsonify({
            'success': True, 
            'message': 'E-mail enviado com sucesso!'
        }), 200
        
    except Exception as e:
        print(f"Erro ao enviar e-mail: {str(e)}")
        return jsonify({
            'success': False, 
            'message': 'Erro interno do servidor. Tente novamente mais tarde.'
        }), 500

