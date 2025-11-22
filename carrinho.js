// ATENÇÃO: Substitua o conteúdo do seu carrinho.js por este código atualizado.

let carrinho = []; // Agora armazenará objetos {id: 1, quantidade: 2}
const listaCarrinho = document.getElementById('lista-carrinho');
const subtotalElement = document.getElementById('subtotal');
const totalItensElement = document.getElementById('total-itens');

// --- Nova estrutura de dados (usaremos o todosProdutos do script.js para obter os dados) ---
// Precisamos carregar todos os dados do catálogo para que o carrinho saiba o preço e nome de cada ID.
let todosProdutos = []; 

async function carregarDadosECarrinho() {
    // ⚠️ ATENÇÃO: Carrega o catálogo ATUALIZADO (com o estoque descontado)
    const catalogoSalvo = localStorage.getItem('catalogoFarmacia');
    
    if (catalogoSalvo) {
        // Usa o catálogo salvo no localStorage
        todosProdutos = JSON.parse(catalogoSalvo);
    } else {
        // Fallback: Se não tiver nada salvo, busca o JSON original
        try {
            const resposta = await fetch("produtos.json");
            todosProdutos = await resposta.json();
        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);
            listaCarrinho.innerHTML = '<p class="carrinho-vazio">Erro ao carregar o catálogo.</p>';
            return;
        }
    }
    
    // Carrega o carrinho salvo
    const carrinhoSalvo = localStorage.getItem('carrinhoFarmacia');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
    
    renderizarCarrinho();
}


// Função para salvar o carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinhoFarmacia', JSON.stringify(carrinho));
    atualizarResumo();
}

// Função auxiliar para obter os detalhes de um produto pelo ID
function getProduto(id) {
    return todosProdutos.find(p => p.id === id);
}

// Função para renderizar a lista de itens (agora agrupados)
function renderizarCarrinho() {
    listaCarrinho.innerHTML = '';
    
    if (carrinho.length === 0) {
        listaCarrinho.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio. Adicione produtos no catálogo!</p>';
        atualizarResumo();
        return;
    }

    carrinho.forEach(itemAgrupado => {
        const produto = getProduto(itemAgrupado.id);
        if (!produto) return; // Ignora se o produto não for encontrado

        const precoTotalItem = produto.preco * itemAgrupado.quantidade;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('carrinho-item');
        itemDiv.innerHTML = `
            <div>
                <h3>${produto.nome}</h3>
                <p>Preço Unitário: R$ ${produto.preco.toFixed(2)}</p>
                <p>Subtotal: R$ ${precoTotalItem.toFixed(2)}</p>
            </div>
            <div class="item-controles">
                <p>Quant.:</p>
                <button onclick="mudarQuantidade(${itemAgrupado.id}, -1)">-</button>
                <span class="quantidade-display">${itemAgrupado.quantidade}</span>
                <button onclick="mudarQuantidade(${itemAgrupado.id}, 1)">+</button>
                <button class="btn-remover" onclick="removerItem(${itemAgrupado.id})">Remover</button>
            </div>
        `;
        listaCarrinho.appendChild(itemDiv);
    });

    atualizarResumo();
}

// Função para calcular e atualizar o resumo (subtotal e contagem)
function atualizarResumo() {
    let subtotal = 0;
    let totalItensUnicos = 0;
    let totalItensQuantidade = 0;

    carrinho.forEach(itemAgrupado => {
        const produto = getProduto(itemAgrupado.id);
        if (produto) {
            subtotal += produto.preco * itemAgrupado.quantidade;
            totalItensUnicos++;
            totalItensQuantidade += itemAgrupado.quantidade;
        }
    });

    subtotalElement.textContent = `Subtotal: R$ ${subtotal.toFixed(2)}`;
    // Exibimos a contagem total de unidades
    totalItensElement.textContent = `Total de Unidades: ${totalItensQuantidade} (${totalItensUnicos} produtos únicos)`; 
}

// --- Funções de Controle de Quantidade ---

function mudarQuantidade(idProduto, valor) {
    const itemExistente = carrinho.find(item => item.id === idProduto);

    if (itemExistente) {
        // Altera a quantidade
        itemExistente.quantidade += valor; 
        
        // Remove o item se a quantidade chegar a 0 ou menos
        if (itemExistente.quantidade <= 0) {
            removerItem(idProduto);
            return;
        }
        salvarCarrinho();
        renderizarCarrinho();
    }
}

// Função para remover um item (remove o item agrupado, independente da quantidade)
function removerItem(idParaRemover) {
    carrinho = carrinho.filter(item => item.id !== idParaRemover);
    salvarCarrinho();
    renderizarCarrinho();
}

function limparCarrinho() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio. Nada para limpar.");
        return;
    }
    if (confirm("Tem certeza que deseja limpar todo o carrinho?")) {
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
    }
}

function descontarEstoque() {
    // Carrega o estoque atual (o catálogo) para ser modificado
    const estoqueAtual = JSON.parse(localStorage.getItem('catalogoFarmacia') || '[]');
    
    // Itera sobre os itens do carrinho
    carrinho.forEach(itemCarrinho => {
        // Encontra o produto correspondente no estoque
        const produtoEstoque = estoqueAtual.find(p => p.id === itemCarrinho.id);
        
        if (produtoEstoque) {
            // Desconta a quantidade comprada do estoque
            produtoEstoque.estoque -= itemCarrinho.quantidade;
            
            // Garante que o estoque não fique negativo
            if (produtoEstoque.estoque < 0) {
                produtoEstoque.estoque = 0;
            }
        }
    });

    // Salva o catálogo com os estoques descontados no localStorage
    localStorage.setItem('catalogoFarmacia', JSON.stringify(estoqueAtual));
}

function finalizarCompra() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio. Adicione itens antes de finalizar a compra.");
        return;
    }

    descontarEstoque();
    
    // Calcula o total para a mensagem de alerta
    let subtotal = 0;
    carrinho.forEach(itemAgrupado => {
        const produto = getProduto(itemAgrupado.id);
        if (produto) {
            subtotal += produto.preco * itemAgrupado.quantidade;
        }
    });

    const totalFormatado = subtotal.toFixed(2);
    alert(`Compra finalizada com sucesso! Total: R$ ${totalFormatado}. O estoque foi atualizado. Obrigado!`);
    
    // 💡 Chamada para limpar o carrinho após a compra
    limparCarrinho(); 
}

// Inicia o carregamento do carrinho ao abrir a página
carregarDadosECarrinho();