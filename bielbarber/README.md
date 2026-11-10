# Biel Cortes - Plataforma de Agendamentos

Sistema de agendamento mobile-first de alta performance para barbearia com recurso único (Biel Cortes). Desenvolvido seguindo princípios de **Clean Architecture**, **Layered Architecture (Controller-Service-Model)** e **Zero Overhead de Dependências no Front-end**.

---

## Arquitetura e Estrutura de Pastas

```text
bielbarber/
│
├── public/                       # FRONT-END (Pronto para Vercel, Netlify ou CDN estático)
│   ├── index.html                # Página principal com fluxo de agendamento (Progressive Disclosure)
│   ├── sobre.html                # Apresentação do profissional, biografia e pilares
│   ├── contato.html              # Canais de atendimento (WhatsApp direto, Instagram, localização)
│   └── assets/
│       ├── css/
│       │   └── style.css         # Design System Dark Urbano Tradicional (CSS Grid & puro)
│       ├── js/
│       │   └── app.js            # Engine de agendamento client-side em Vanilla JS
│       └── img/
│           ├── logo.svg          # Logotipo vetorial em alta resolução com gradiente metálico
│           └── logo.png          # Fallback de imagem
│
└── server/                       # BACK-END (Node.js + Express + Mongoose)
    ├── package.json
    ├── .env.example
    ├── .env
    ├── server.js                 # Ponto de entrada (Bootstrap do servidor e DB)
    └── src/
        ├── app.js                # Configuração do Express, CORS e Middlewares
        ├── config/
        │   ├── database.js       # Conexão com MongoDB Atlas
        │   └── business.js       # Regras de negócio da barbearia (expediente, pausas, serviços)
        ├── controllers/
        │   └── AppointmentController.js  # Recepção de requisições e respostas HTTP
        ├── services/
        │   └── AppointmentService.js     # Regras de negócio, cálculo on-the-fly e prevenção de concorrência
        ├── models/
        │   └── Appointment.js            # Model Mongoose com indexação temporal de alta performance
        ├── routes/
        │   └── api.js                    # Definição e mapeamento dos endpoints RESTful
        └── utils/
            └── timeUtils.js              # Funções utilitárias puras de tempo e checagem de sobreposição
```

---

## 🎯 Padrões de Projeto Aplicados (Design Patterns)

1. **Layered Architecture (Camadas Desacopladas)**:
   - **Routes**: Mapeamento limpo dos endpoints sem lógica embutida.
   - **Controllers**: Validação inicial de requisições e formatação de respostas HTTP.
   - **Services**: Concentração de todas as regras de negócio (cálculo de slots, intervalos e validações).
   - **Models**: Esquema de dados com índices compostos para otimização de queries no MongoDB.
   - **Utils**: Funções puras e isoladas para manipulação e cálculos de tempo.

2. **Progressive Disclosure (Front-end)**:
   - Apresentação de dados em etapas (Serviço &rarr; Data &rarr; Horário &rarr; Coleta &rarr; Sucesso), diminuindo a carga cognitiva e aumentando a conversão de agendamentos em dispositivos móveis.

3. **Single Source of Truth (Configurações de Negócio)**:
   - Centralização dos horários de expediente, pausas de almoço e catálogo em `src/config/business.js`.

4. **Algoritmo de Prevenção de Conflito Temporal**:
   $$\text{Conflito} \iff (\text{slotStart} < \text{busy.end} \ \land \ \text{slotEnd} > \text{busy.start})$$
   Garante bloqueio de sobreposições com resposta de erro semântica `409 Conflict`.

---

## 🚀 Como Executar

### 1. Front-end:
- Abra diretamente o arquivo [`public/index.html`](file:///c:/Users/ebaoliveira/Desktop/bielbarber/public/index.html) em seu navegador.
- Ou aponte a raiz de deploy estático (Netlify/Vercel) para a pasta `public/`.

### 2. Back-end:
1. Acesse o diretório `server/`:
   ```bash
   cd server
   npm install
   ```
2. Defina as variáveis de ambiente em `.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<usuario>:<senha>@cluster0.mongodb.net/bielbarber?retryWrites=true&w=majority
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
