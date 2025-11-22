// Variável global para armazenar todos os dados carregados
let todosProdutos = []; 
// Variável global para simular o carrinho de compras
let carrinho = [];
const cardContainer = document.getElementById('card-container');
const carrinhoCountElement = document.getElementById('carrinho-count'); // Novo elemento

// 1. Função para carregar os dados E o carrinho
async function carregarDados() {
    const catalogoSalvo = localStorage.getItem('catalogoFarmacia');
    
    if (catalogoSalvo) {
        // ✅ Se houver catálogo salvo (com estoque atualizado), usa ele
        todosProdutos = JSON.parse(catalogoSalvo);
    } else {
        // Se for a primeira vez, carrega do JSON e salva o original
        try {
            const resposta = await fetch("produtos.json");
            if (!resposta.ok) {
                throw new Error(`Erro ao carregar o JSON: ${resposta.status}`);
            }
            todosProdutos = await resposta.json();
            salvarEstoque(); // Salva a versão original pela primeira vez
        } catch (erro) {
            console.error("Erro no carregamento de dados:", erro);
            cardContainer.innerHTML = "<p>Não foi possível carregar o catálogo de produtos.</p>";
            // Se não carregar, paramos a execução
            return; 
        }
    }
    
    // 🚀 Carrega o carrinho salvo do localStorage (Essa parte estava correta)
    const carrinhoSalvo = localStorage.getItem('carrinhoFarmacia');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
    
    // Renderiza o catálogo (agora com o estoque correto)
    renderizarCards(todosProdutos); 
    atualizarContagemCarrinho(); // Atualiza a contagem
}
// Função auxiliar para salvar o carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinhoFarmacia', JSON.stringify(carrinho));
}

// 🚀 MELHORIA 1: Função para atualizar a contagem de itens no carrinho
function atualizarContagemCarrinho() {
    if (carrinhoCountElement) {
        carrinhoCountElement.textContent = carrinho.length;
    }
}

// 2. Função para renderizar os cards no DOM
function renderizarCards(dadosParaRenderizar) {
    cardContainer.innerHTML = ''; 

    if (dadosParaRenderizar.length === 0) {
        cardContainer.innerHTML = "<p>Nenhum produto encontrado com o termo pesquisado.</p>";
        return;
    }

    for (const produto of dadosParaRenderizar) {
        const article = document.createElement("article");
        article.classList.add("card");
        
        // Determina se o produto está esgotado
        const esgotado = produto.estoque <= 0;
        
        article.innerHTML = `
            <h2>${produto.nome}</h2>
            <p><strong>Categoria:</strong> ${produto.categoria}</p>
            <p>${produto.descricao}</p>
            <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
            <p class="estoque" style="color: ${esgotado ? '#dc3545' : '#28a745'};">
                Estoque disponível: ${esgotado ? 'ESGOTADO' : produto.estoque + ' unidades'}
            </p> 
        `;

        const botoesContainer = document.createElement('div');
        botoesContainer.classList.add('card-botoes');

        const btnCarrinho = document.createElement('button');
        btnCarrinho.className = 'btn btn-carrinho';
        btnCarrinho.textContent = 'Adicionar ao Carrinho';
        btnCarrinho.addEventListener('click', () => adicionarAoCarrinho(produto.id));

        const btnComprar = document.createElement('button');
        btnComprar.className = 'btn btn-comprar';
        btnComprar.textContent = 'Comprar Agora';
        btnComprar.addEventListener('click', () => comprarAgora(produto.id));
        
        const btnDetalhes = document.createElement('button');
        btnDetalhes.className = 'btn-detalhes';
        btnDetalhes.textContent = 'Ver Detalhes';
        btnDetalhes.addEventListener('click', (event) => verDetalhes(event.target, produto.detalhes));

        // 🚀 MELHORIA 2: Desativação do botão se o produto estiver esgotado
        if (esgotado) {
            btnCarrinho.disabled = true;
            btnCarrinho.textContent = 'Esgotado';
            btnComprar.disabled = true;
        }

        botoesContainer.appendChild(btnCarrinho);
        botoesContainer.appendChild(btnComprar);
        
        article.appendChild(botoesContainer);
        article.appendChild(btnDetalhes);

        cardContainer.appendChild(article);
    }
}

// 4. Função para mostrar/ocultar detalhes (toggle)
function verDetalhes(botao, detalhes) {
    const card = botao.closest('.card');
    const detalhesContainer = card.querySelector('.detalhes-container');

    if (detalhesContainer) {
        detalhesContainer.remove();
        botao.textContent = 'Ver Detalhes';
    } else {
        const novoDetalhesContainer = document.createElement('div');
        novoDetalhesContainer.classList.add('detalhes-container');
        
        novoDetalhesContainer.innerHTML = `
            <h4>Detalhes do Produto:</h4>
            <ul>
                <li><strong>Fabricante:</strong> ${detalhes.fabricante || 'N/A'}</li>
                <li><strong>Data de Validade:</strong> ${detalhes.data_validade || 'N/A'}</li>
                <li><strong>Dosagem:</strong> ${detalhes.dosagem || 'N/A'}</li>
                <li><strong>Forma Farmacêutica:</strong> ${detalhes.forma_farmaceutica || 'N/A'}</li>
            </ul>
        `;
        // Insere o container de detalhes logo após o botão
        botao.insertAdjacentElement('afterend', novoDetalhesContainer);
        botao.textContent = 'Ocultar Detalhes';
    }
}

// 3. Função de Pesquisa
function filtrarProdutos() {
    const termoBusca = document.getElementById('busca-input').value.toLowerCase().trim();
    
    const produtosFiltrados = todosProdutos.filter(produto => 
        produto.nome.toLowerCase().includes(termoBusca) ||
        produto.categoria.toLowerCase().includes(termoBusca) ||
        produto.descricao.toLowerCase().includes(termoBusca)
    );

    renderizarCards(produtosFiltrados); 
}

// 5. Funções para os botões de compra e carrinho
function adicionarAoCarrinho(produtoId) {
    const produto = todosProdutos.find(p => p.id === produtoId);
    
    if (!produto || produto.estoque <= 0) {
        alert(!produto ? "Erro: Produto não encontrado." : `${produto.nome} está esgotado!`);
        return;
    }

    // 🚀 LÓGICA DE AGRUPAMENTO (AGORA APLICADA NO CATÁLOGO)
    
    // 1. Tenta encontrar o item no carrinho (pelo ID)
    let itemExistente = carrinho.find(item => item.id === produtoId);

    if (itemExistente) {
        // 2. Se existe, apenas incrementa a quantidade
        itemExistente.quantidade++;
    } else {
        // 3. Se não existe, adiciona um novo item com quantidade 1
        carrinho.push({ id: produtoId, quantidade: 1 });
    }

    // Salva o novo estado e atualiza a contagem
    salvarCarrinho(); 
    atualizarContagemCarrinho(); 
    
    console.log(`${produto.nome} foi adicionado ao carrinho!`);
    alert(`${produto.nome} foi adicionado ao carrinho! Total de itens: ${carrinho.length}`);
}

function salvarEstoque() {
    localStorage.setItem('catalogoFarmacia', JSON.stringify(todosProdutos));
}

function comprarAgora(produtoId) {
    const produto = todosProdutos.find(p => p.id === produtoId);
    
    if (!produto) return;
    
    if (produto.estoque <= 0) {
        alert(`${produto.nome} está esgotado! Não é possível comprar.`);
        return;
    }

    // 🚀 Ação: Desconta 1 unidade
    produto.estoque--;
    
    // Alerta a compra e informa o novo estoque
    alert(`Compra de 1 unidade de ${produto.nome} finalizada! Estoque restante: ${produto.estoque}.`);
    
    // Atualiza o display do catálogo e salva o estoque (IMPORTANTE!)
    renderizarCards(todosProdutos);
    salvarEstoque(); // Chamamos a nova função de salvamento do estoque
}

// Inicializa a aplicação carregando os dados quando a página é aberta
carregarDados();