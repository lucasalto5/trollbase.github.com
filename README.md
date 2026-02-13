# TROLL BASE

<p align="center">
  Jogo 2D em <strong>Phaser</strong> criado para estudo, prática e evolução contínua em desenvolvimento de games.
</p>

<p align="center">
  <img alt="Phaser" src="https://img.shields.io/badge/Phaser-3-1f6feb?style=for-the-badge">
  <img alt="Status" src="https://img.shields.io/badge/status-em%20desenvolvimento-ffb703?style=for-the-badge">
  <img alt="Plataforma" src="https://img.shields.io/badge/plataforma-web-22c55e?style=for-the-badge">
</p>

---

## Sobre o projeto

O **TROLL BASE** é um projeto pessoal focado em aprender Phaser de forma prática, construindo fases jogáveis com armadilhas, progressão e modos de jogo.

Este projeto existe para treinar:
- Estrutura de cenas e fluxo de jogo no Phaser
- Física Arcade (movimento, gravidade, colisão)
- Design de fases com eventos e traps
- Interface do usuário (menu, HUD, feedback visual)
- Compatibilidade entre desktop e mobile

---

## Funcionalidades atuais

- Menu principal com progressão salva em `localStorage`
- Múltiplas fases com obstáculos e trollagens
- Modos: **Normal**, **Hardcore** e **Speedrun**
- Controles de teclado no desktop
- Controles touch automáticos no mobile
- Bloqueio para jogar no celular em **modo paisagem**

---

## Jogar Agora

Funciona em **PC** e **mobile**:

- https://lucasalto5.github.io/trollbase.github.com/

---

## Tecnologias

- HTML5
- JavaScript (Vanilla)
- [Phaser 3](https://phaser.io/)

---

## Como executar

### 1. Clone o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DA_PASTA>
```

### 2. Rode em servidor local

Você pode usar qualquer servidor estático. Exemplos:

```bash
# Node (http-server)
npx http-server .
```

ou via extensão **Live Server** no VS Code.

### 3. Abra no navegador

Acesse o endereço gerado pelo servidor (ex.: `http://localhost:8080`).

---

## Estrutura do projeto

```text
.
|-- assets/
|-- src/
|   |-- main.js
|   `-- scenes/
|       |-- Start.js
|       |-- mobile/
|       |   `-- MobileControls.js
|       `-- levels/
|-- index.html
`-- phaser.js
```

---

## Objetivo de aprendizado

A ideia é evoluir este repositório como laboratório de estudo em game dev, melhorando código, design de fases e experiência de jogo a cada versão.

---

## Apoie o projeto 

Se quiser fortalecer o projeto, sua ajuda contribui para:
- Criar fases mais elaboradas
- Melhorar arte/efeitos/sons
- Lançar novos jogos e protótipos

**Dados para doação**
- **Discord** `rogerinhoxr`

---

## Roadmap

- Melhorar balanceamento das fases
- Adicionar novos inimigos e eventos
- Refinar HUD e feedback visual
- Publicar versão jogável online

---

## Licença

Este projeto está sob a licença **MIT**.  
Veja o arquivo `LICENSE` para mais detalhes.
