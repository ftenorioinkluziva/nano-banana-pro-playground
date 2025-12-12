FROM node:20-alpine

WORKDIR /app

# Instala dependências
COPY package*.json ./
# Se usar pnpm, descomente abaixo e comente o npm install
# RUN npm install -g pnpm && pnpm install
RUN npm install

# Copia o resto do código
COPY . .

# Build da aplicação
RUN npm run build

# Expõe a porta padrão do Next.js
EXPOSE 3000

# Inicia a aplicação
CMD ["npm", "start"]