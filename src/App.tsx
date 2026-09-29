import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function App() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePDF = async () => {
    if (!reportRef.current || isGenerating) {
      console.log("⚠️ Bloqueado:", { hasRef: !!reportRef.current, isGenerating });
      return;
    }

    console.log("🚀 Iniciando geração do PDF...");
    setIsGenerating(true);
    setProgress(0);

    try {
      const pages = reportRef.current.querySelectorAll<HTMLElement>(".page");
      console.log(`📄 Encontradas ${pages.length} páginas`);

      if (pages.length === 0) {
        throw new Error("Nenhuma página encontrada!");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        console.log(`📸 Capturando página ${i + 1}/${pages.length}...`);

        // Scroll para garantir que a página está visível
        page.scrollIntoView({ behavior: "smooth", block: "start" });
        await new Promise(resolve => setTimeout(resolve, 300));

        // Capturar página com html2canvas
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: page.scrollWidth,
          height: page.scrollHeight,
          windowWidth: page.scrollWidth,
          windowHeight: page.scrollHeight,
        });

        console.log(`✅ Canvas criado: ${canvas.width}x${canvas.height}px`);

        // Converter para imagem
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        // Adicionar página ao PDF
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        
        const progressValue = Math.round(((i + 1) / pages.length) * 100);
        setProgress(progressValue);
        console.log(`📊 Progresso: ${progressValue}%`);
      }

      console.log("💾 Salvando PDF...");
      
      // Método 1: Tentar com pdf.save() diretamente
      try {
        pdf.save("Relatorio-Aftermarket-MG-FrotaAI.pdf");
        console.log("✅ PDF baixado com sucesso via pdf.save()!");
      } catch (saveError) {
        console.warn("⚠️ pdf.save() falhou, tentando método alternativo...", saveError);
        
        // Método 2: Fallback com blob e link
        const pdfBlob = pdf.output("blob");
        const url = URL.createObjectURL(pdfBlob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = "Relatorio-Aftermarket-MG-FrotaAI.pdf";
        link.style.display = "none";
        document.body.appendChild(link);
        
        console.log("🔗 Link criado, clicando...");
        
        // Criar e disparar evento de clique
        const clickEvent = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: false,
        });
        link.dispatchEvent(clickEvent);
        
        // Limpar
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
          console.log("✅ PDF baixado com sucesso via link!");
        }, 100);
      }

    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF. Verifique o console para mais detalhes.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <>
      {/* Botão de download com progresso */}
      <div
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
        }}
      >
        {isGenerating && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 500,
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "6px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #2a62ff, #60a5fa)",
                  borderRadius: "3px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span>Gerando... {progress}%</span>
          </div>
        )}
        
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          style={{
            background: isGenerating
              ? "#64748b"
              : "linear-gradient(135deg, #2a62ff 0%, #1d4ed8 100%)",
            color: "white",
            border: "none",
            padding: "20px 30px",
            borderRadius: "50px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isGenerating ? "not-allowed" : "pointer",
            boxShadow: "0 8px 30px rgba(42, 98, 255, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(42, 98, 255, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(42, 98, 255, 0.4)";
          }}
        >
          {isGenerating ? (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Gerando PDF...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Baixar PDF Completo
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Container do relatório */}
      <div ref={reportRef}>

      {/* CAPA */}
      <div className="page cover-page">
        <div className="brand">FrotaAI</div>
        <h1>
          MINAS GERAIS:
          <br />O GIGANTE DO AFTERMARKET
        </h1>
        <h2>
          Relatório analítico sobre frota, envelhecimento e oportunidades no
          mercado de reposição automotiva.
        </h2>
        <div className="meta">
          <p>
            <strong>Por:</strong> FrotaAI | Sistema de inteligência de mercado
            automotivo
          </p>
          <p>
            <strong>Data:</strong> Setembro de 2026
          </p>
          <p>
            <strong>Contato:</strong> contato@frotaai.com.br
          </p>
        </div>
      </div>

      {/* CONTEÚDO - PÁGINA 2 */}
      <div className="page">
        <h1 className="section-title">Resumo Executivo</h1>
        <ul className="executive-summary">
          <li>
            <strong>Panorama central:</strong> Minas Gerais possui uma frota
            total ativa de 13.868.228 veículos nas quatro principais categorias.
          </li>
          <li>
            <strong>Frota madura:</strong> 65,2% dos veículos leves e 69,3% dos
            caminhões têm 13 anos ou mais, sustentando uma demanda recorrente de
            reparação.
          </li>
          <li>
            <strong>Índice de oportunidade:</strong> a relação supera 160
            veículos por estabelecimento de reparação quando consideradas as
            quatro categorias.
          </li>
          <li>
            <strong>Polos econômicos:</strong> Belo Horizonte, Uberlândia e
            Contagem concentram volume de frota, poder aquisitivo e atividade
            industrial e logística.
          </li>
          <li>
            <strong>Duas rodas:</strong> a Honda reúne 2.927.619 motocicletas,
            mais de 77% de market share no segmento em Minas Gerais.
          </li>
        </ul>

        <h1 className="section-title">
          1. Introdução: A Base de Dados que Define o Mercado
        </h1>
        <p>
          No setor de reparação automotiva, intuição não substitui inteligência
          de dados. Minas Gerais, com sua extensão territorial e vocação
          logística, representa um dos ecossistemas mais complexos e lucrativos
          do Brasil.
        </p>
        <p>
          O que realmente move o aftermarket mineiro não é apenas o tamanho
          absoluto de sua frota, mas a composição e a maturidade desses
          veículos. Com base nos dados consolidados mais recentes, a frota total
          ativa em Minas Gerais soma 13.868.228 veículos nas quatro principais
          categorias.
        </p>
        <p>
          Este relatório analítico disseca essa volumetria, demonstrando como o
          envelhecimento da frota, a concentração geográfica e a curva de giro
          de modelos específicos criam um mapa de oportunidades claro para
          fabricantes, distribuidores e oficinas independentes.
        </p>

        <h1 className="section-title">
          2. Análise de Frota: O Equilíbrio que Sustenta o Varejo
        </h1>
        <p>
          A distribuição percentual da frota mineira revela um mercado
          equilibrado, onde cada segmento exige uma estratégia de estoque e
          atendimento distinta.
        </p>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Unidades</th>
              <th>Participação</th>
              <th>Implicação estratégica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Veículos Leves (Passeio)</td>
              <td>8.347.832</td>
              <td>60,2%</td>
              <td>
                Principal motor de volume para oficinas independentes e varejos
                multimarcas.
              </td>
            </tr>
            <tr>
              <td>Motocicletas</td>
              <td>3.755.887</td>
              <td>27,1%</td>
              <td>
                Mercado gigantesco, caracterizado por peças de desgaste rápido e
                altíssimo giro de estoque.
              </td>
            </tr>
            <tr>
              <td>Pick-ups</td>
              <td>1.194.353</td>
              <td>8,6%</td>
              <td>
                Segmento de elevado valor agregado, com ticket médio alto em
                componentes de suspensão, transmissão e motorização devido ao
                uso severo.
              </td>
            </tr>
            <tr>
              <td>Caminhões (Pesados)</td>
              <td>570.156</td>
              <td>4,1%</td>
              <td>
                Embora menor em quantidade física, possui importância
                estratégica monumental devido ao escoamento logístico, agrícola
                e mineral, movimentando fortemente os Truck Centers.
              </td>
            </tr>
          </tbody>
        </table>

        <h1 className="section-title">
          3. O "Ouro" do Aftermarket: A Idade da Frota
        </h1>
        <p>
          Para o varejo de giro rápido e reparação, veículos com mais de 8 anos
          — e especialmente acima de 13 anos — são os clientes mais valiosos,
          pois já saíram da garantia de fábrica e exigem manutenção corretiva
          constante. Em Minas Gerais, a idade média é bastante elevada em todas
          as categorias, validando a demanda recorrente.
        </p>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Frota com 13+ anos</th>
              <th>Participação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Veículos Leves</td>
              <td>5.443.648 unidades</td>
              <td>65,2%</td>
            </tr>
            <tr>
              <td>Caminhões</td>
              <td>395.256 unidades</td>
              <td>69,3%</td>
            </tr>
            <tr>
              <td>Motocicletas</td>
              <td>2.343.902 unidades</td>
              <td>62,4%</td>
            </tr>
            <tr>
              <td>Pick-ups</td>
              <td>541.049 unidades</td>
              <td>45,3%</td>
            </tr>
          </tbody>
        </table>

        <div className="highlight-box">
          <h2 className="subsection-title" style={{ marginTop: 0 }}>
            O Pipeline Futuro
          </h2>
          <p>
            A análise histórica aponta um movimento recente de licenciamento:
            291.014 veículos em 2024; 432.953 em 2025; e 284.170 em 2026.
          </p>
          <p>
            Embora essa frota recente, de 0 a 3 anos, esteja hoje majoritariamente
            nas concessionárias, o expressivo volume de 2025 representa o
            "amanhã" do mercado de reposição independente.
          </p>
          <p>
            Em 3 a 4 anos, essa volumetria sairá da garantia e passará a
            abastecer diretamente o varejo de autopeças e oficinas mecânicas do
            estado.
          </p>
        </div>
      </div>

      {/* PÁGINA 3 */}
      <div className="page">
        <h1 className="section-title">
          4. Curva de Giro A: Onde Está o Estoque que Vende?
        </h1>
        <p>
          O planejamento de estoque em MG deve ser cirúrgico, priorizando as
          marcas e modelos que dominam as ruas. Os dados de circulação apontam
          os seguintes líderes absolutos.
        </p>
        <table>
          <thead>
            <tr>
              <th>Segmento</th>
              <th>Marcas líderes</th>
              <th>Modelos de maior giro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Veículos Leves</td>
              <td>
                Volkswagen — 2.385.845
                <br />
                Fiat — 2.128.270
                <br />
                Chevrolet — 1.415.652
              </td>
              <td>
                VW Gol — 883.926
                <br />
                Fiat Uno — 629.204
                <br />
                Fiat Palio — 593.195
                <br />
                Chevrolet Onix — 318.633
                <br />
                VW Fusca — 267.433
              </td>
            </tr>
            <tr>
              <td>Pick-ups</td>
              <td>Fiat — 529.869</td>
              <td>
                Fiat Strada — 428.746
                <br />
                VW Saveiro — 166.026
                <br />
                Chevrolet S10 — 108.367
              </td>
            </tr>
            <tr>
              <td>Motocicletas</td>
              <td>
                Honda — 2.927.619 (77%+ market share)
                <br />
                Yamaha — 614.646
              </td>
              <td>
                Honda CG — 1.507.562
                <br />
                Honda Biz — 244.382
                <br />
                Honda NXR 150 — 169.259
              </td>
            </tr>
            <tr>
              <td>Caminhões</td>
              <td>
                Mercedes-Benz — 252.015
                <br />
                Volkswagen — 117.669
              </td>
              <td>
                Mercedes-Benz L — 89.654
                <br />
                MB Atego — 21.798
                <br />
                Ford Cargo — 21.218
              </td>
            </tr>
          </tbody>
        </table>

        <h1 className="section-title">
          5. Geografia da Demanda: os polos econômicos
        </h1>
        <p>
          A concentração da frota reflete diretamente o PIB e a densidade
          demográfica. Três polos se destacam pela capacidade de consumo e
          volume de veículos.
        </p>
        <table>
          <thead>
            <tr>
              <th>Município/Região</th>
              <th>População</th>
              <th>PIB per capita (R$)</th>
              <th>Frota leve</th>
              <th>Pick-ups</th>
              <th>Motocicletas</th>
              <th>Caminhões</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Belo Horizonte</td>
              <td>2.415.451</td>
              <td>53.882,20</td>
              <td>2.039.967</td>
              <td>265.633</td>
              <td>338.053</td>
              <td>77.257</td>
            </tr>
            <tr>
              <td>Uberlândia</td>
              <td>768.339</td>
              <td>67.640,79</td>
              <td>313.652</td>
              <td>41.241</td>
              <td>137.974</td>
              <td>20.044</td>
            </tr>
            <tr>
              <td>Contagem</td>
              <td>652.973</td>
              <td>69.375,58</td>
              <td>241.249</td>
              <td>24.600</td>
              <td>72.714</td>
              <td>22.172</td>
            </tr>
          </tbody>
        </table>
        <ul className="executive-summary" style={{ marginTop: "20px" }}>
          <li>
            <strong>Belo Horizonte:</strong> capital com 2,41 milhões de
            habitantes e PIB per capita de R$ 53.882,20, concentra a maior
            frota.
          </li>
          <li>
            <strong>Uberlândia:</strong> polo do Triângulo Mineiro, com PIB per
            capita elevado de R$ 67.640,79, forte poder aquisitivo e frota mais
            nova.
          </li>
          <li>
            <strong>Contagem:</strong> polo industrial e logístico, com PIB per
            capita de R$ 69.375,58, sendo um hub natural para serviços pesados
            e de frota.
          </li>
        </ul>

        <h1 className="section-title">
          6. O Ecossistema de Leads e a Relação Frota vs. Oficinas
        </h1>
        <p>
          A base de dados do FrotaAI mapeia 321.866 empresas ativas no setor
          automotivo em MG, com excelente cobertura de contato: 318.550 com
          telefone e 100% com e-mail. A divisão por categoria mostra a
          capilaridade do mercado.
        </p>
        <table>
          <thead>
            <tr>
              <th>Categoria de atuação</th>
              <th>Número de empresas (leads)</th>
              <th>Cobertura/descrição de oportunidade</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mobilidade e Transporte Individual</td>
              <td>121.602</td>
              <td>Alta capilaridade</td>
            </tr>
            <tr>
              <td>Oficinas e Centros Automotivos</td>
              <td>85.631</td>
              <td>Alvo principal para peças e equipamentos</td>
            </tr>
            <tr>
              <td>Transportadoras</td>
              <td>81.352</td>
              <td>Oportunidade B2B e gestão de frotas</td>
            </tr>
            <tr>
              <td>Comércio de Autopeças</td>
              <td>28.011</td>
              <td>Canal de distribuição e varejo</td>
            </tr>
            <tr>
              <td>Serviços Auxiliares/Vistorias/Ind.</td>
              <td>5.263</td>
              <td>Nichos especializados</td>
            </tr>
            <tr>
              <td>
                <strong>TOTAL GERAL</strong>
              </td>
              <td>
                <strong>321.866</strong>
              </td>
              <td>318.550 com telefone | 100% com e-mail</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PÁGINA 4 */}
      <div className="page">
        <h1 className="section-title">7. O Índice de Oportunidade</h1>
        <p>
          Ao cruzar o volume de veículos com a infraestrutura de reparação, o
          cenário é de alta demanda. Dividindo a frota de leves, de 8,34
          milhões, pelas oficinas, são 85.631 estabelecimentos e uma média de
          aproximadamente 97,5 veículos leves para cada oficina.
        </p>
        <p>
          Se adicionarmos comerciais leves, pesados e motos, elevando a frota
          para 13,8 milhões, a relação ultrapassa 160 veículos por
          estabelecimento de reparação.
        </p>
        <div className="highlight-box">
          <p>
            <strong>Leitura estratégica:</strong> esse alto índice comprova que
            a demanda contínua tende a saturar a capacidade das oficinas atuais,
            tornando o estado altamente lucrativo para a distribuição de peças e
            implantação de novos negócios.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Indicadores-chave:</strong> ~97,5 veículos leves por oficina
            | mais de 160 veículos por estabelecimento quando consideradas as
            quatro categorias.
          </p>
        </div>

        <h1 className="section-title">
          10. Tabelas Analíticas Consolidadas
        </h1>

        <h2 className="subsection-title">
          Tabela 1: Frota Circulante nos Principais Polos de MG
        </h2>
        <table>
          <thead>
            <tr>
              <th>Município/Região</th>
              <th>População</th>
              <th>PIB per capita (R$)</th>
              <th>Frota leve</th>
              <th>Pick-ups</th>
              <th>Motocicletas</th>
              <th>Caminhões</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Belo Horizonte</td>
              <td>2.415.451</td>
              <td>53.882,20</td>
              <td>2.039.967</td>
              <td>265.633</td>
              <td>338.053</td>
              <td>77.257</td>
            </tr>
            <tr>
              <td>Uberlândia</td>
              <td>768.339</td>
              <td>67.640,79</td>
              <td>313.652</td>
              <td>41.241</td>
              <td>137.974</td>
              <td>20.044</td>
            </tr>
            <tr>
              <td>Contagem</td>
              <td>652.973</td>
              <td>69.375,58</td>
              <td>241.249</td>
              <td>24.600</td>
              <td>72.714</td>
              <td>22.172</td>
            </tr>
          </tbody>
        </table>

        <h2 className="subsection-title">
          Tabela 2: Envelhecimento da Frota por Segmento (Foco em 13+ Anos)
        </h2>
        <table>
          <thead>
            <tr>
              <th>Faixa etária</th>
              <th>Veículos leves</th>
              <th>%</th>
              <th>Pick-ups</th>
              <th>%</th>
              <th>Motocicletas</th>
              <th>%</th>
              <th>Caminhões</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0 a 3 anos</td>
              <td>1.225.774</td>
              <td>14,7%</td>
              <td>308.239</td>
              <td>25,8%</td>
              <td>519.486</td>
              <td>13,8%</td>
              <td>47.932</td>
              <td>8,4%</td>
            </tr>
            <tr>
              <td>4 a 7 anos</td>
              <td>676.382</td>
              <td>8,1%</td>
              <td>163.915</td>
              <td>13,7%</td>
              <td>411.526</td>
              <td>11,0%</td>
              <td>74.500</td>
              <td>13,1%</td>
            </tr>
            <tr>
              <td>8 a 12 anos</td>
              <td>1.002.028</td>
              <td>12,0%</td>
              <td>181.150</td>
              <td>15,2%</td>
              <td>480.973</td>
              <td>12,8%</td>
              <td>52.468</td>
              <td>9,2%</td>
            </tr>
            <tr>
              <td>13+ anos</td>
              <td>5.443.648</td>
              <td>65,2%</td>
              <td>541.049</td>
              <td>45,3%</td>
              <td>2.343.902</td>
              <td>62,4%</td>
              <td>395.256</td>
              <td>69,3%</td>
            </tr>
          </tbody>
        </table>

        <h2 className="subsection-title">
          Tabela 3: Indicadores de Densidade e Oportunidade de Mercado
        </h2>
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Valor calculado</th>
              <th>Interpretação estratégica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Frota Total Ativa (4 categorias)</td>
              <td>13.868.228</td>
              <td>Base sólida e diversificada de demanda.</td>
            </tr>
            <tr>
              <td>Veículos Leves por Oficina</td>
              <td>~97,5</td>
              <td>Fluxo constante e saudável para oficinas multimarcas.</td>
            </tr>
            <tr>
              <td>Frota Ampla por Oficina</td>
              <td>{"> 160"}</td>
              <td>
                Alta saturação de demanda, indicando necessidade de expansão de
                vagas produtivas e eficiência operacional.
              </td>
            </tr>
          </tbody>
        </table>

        <h2 className="subsection-title">
          Tabela 4: Ecossistema de Leads Automotivos em MG
        </h2>
        <table>
          <thead>
            <tr>
              <th>Categoria de atuação</th>
              <th>Número de empresas (leads)</th>
              <th>Cobertura de contato</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mobilidade e Transporte Individual</td>
              <td>121.602</td>
              <td>Alta capilaridade</td>
            </tr>
            <tr>
              <td>Oficinas e Centros Automotivos</td>
              <td>85.631</td>
              <td>Alvo principal para peças e equipamentos</td>
            </tr>
            <tr>
              <td>Transportadoras</td>
              <td>81.352</td>
              <td>Oportunidade B2B e gestão de frotas</td>
            </tr>
            <tr>
              <td>Comércio de Autopeças</td>
              <td>28.011</td>
              <td>Canal de distribuição e varejo</td>
            </tr>
            <tr>
              <td>Serviços Auxiliares/Vistorias/Ind.</td>
              <td>5.263</td>
              <td>Nichos especializados</td>
            </tr>
            <tr>
              <td>
                <strong>TOTAL GERAL</strong>
              </td>
              <td>
                <strong>321.866</strong>
              </td>
              <td>318.550 com telefone | 100% com e-mail</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PÁGINA 5 - CONCLUSÃO */}
      <div className="page">
        <h1 className="section-title">
          11. Notas Analíticas e Conclusão: O Veredito dos Dados
        </h1>
        <p>
          A análise crua dos dados do FrotaAI elimina suposições e aponta três
          verdades de mercado para quem opera em Minas Gerais.
        </p>

        <ol style={{ marginLeft: "20px", marginBottom: "30px" }}>
          <li style={{ marginBottom: "15px" }}>
            <strong>A Regra dos 13+ Anos é Soberana:</strong> com mais de 5,4
            milhões de carros de passeio e quase 400 mil caminhões com mais de
            13 anos, o planejamento de estoque deve ser enviesado para a "Curva
            A" da manutenção corretiva tardia, incluindo suspensão, freios,
            correias e embreagem. Ignorar a longevidade da frota é deixar
            dinheiro na mesa.
          </li>
          <li style={{ marginBottom: "15px" }}>
            <strong>O Monopólio das Duas Rodas:</strong> com 77% de market
            share, a Honda, especialmente as linhas CG e Biz, dita o ritmo do
            segmento de motocicletas. Qualquer autopeças ou oficina que não
            tenha uma solução ágil e competitiva para este volume, de 2,9
            milhões de unidades, está subaproveitando 27% da frota do estado.
          </li>
          <li style={{ marginBottom: "15px" }}>
            <strong>O "Efeito Represa" de 2025:</strong> os 432.953 veículos
            licenciados em 2025 estão hoje nas concessionárias. No entanto,
            distribuidores e oficinas que começarem a mapear e se relacionar com
            os proprietários desses veículos agora estarão posicionados para
            capturar essa demanda assim que a garantia de 3 a 4 anos expirar,
            migrando o fluxo para o mercado independente.
          </li>
        </ol>

        <div className="highlight-box">
          <h2 className="subsection-title" style={{ marginTop: 0 }}>
            Conclusão
          </h2>
          <p style={{ marginBottom: 0 }}>
            Minas Gerais não é apenas um mercado de volume; é um mercado de
            recorrência garantida pela idade da frota. A relação de mais de 160
            veículos por ponto de reparação comprova que a infraestrutura atual
            trabalha em alta capacidade. Para fabricantes, distribuidores e
            reparadores, o estado oferece um terreno fértil, previsível e
            altamente lucrativo, desde que as decisões de estoque e expansão
            sejam guiadas por inteligência de dados, e não por achismos.
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "50px",
            color: "#64748b",
            fontSize: "10pt",
          }}
        >
          Por FrotaAI — Sistema de inteligência de mercado automotivo. Análise
          além do óbvio.
          <br />
          Setembro de 2026 | contato@frotaai.com.br
        </p>
      </div>

      {/* PÁGINA DE FECHAMENTO (CALL TO ACTION) */}
      <div className="page closing-page">
        <h2>Pare de decidir no escuro.</h2>

        <ul className="action-list">
          <li>Otimize seu estoque.</li>
          <li>Preveja sua demanda.</li>
          <li>Encontre onde estão seus clientes.</li>
          <li>Enxergue seus concorrentes.</li>
          <li>Identifique novos mercados.</li>
          <li>Pare de deixar dinheiro na mesa.</li>
        </ul>

        <p>
          O FrotaAI transforma inteligência de mercado em decisões mais precisas
          para quem precisa vender mais, comprar melhor e crescer com direção.
        </p>
        <p>
          Se você ainda toma decisões comerciais olhando apenas para o que já
          vendeu, talvez esteja enxergando apenas uma parte do mercado.
        </p>
        <p
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: "14pt",
            marginTop: "30px",
          }}
        >
          Quer descobrir o que está acontecendo antes que a oportunidade passe?
        </p>

        <div className="contact-info">
          <div>frotaai.com.br</div>
          <div>contato@frotaai.com.br</div>
          <div>WhatsApp: (11) 96905-2887</div>
        </div>

        <div className="final-tagline">
          Fale com o FrotaAI. O mercado acontece.
          <br />A gente ajuda você a enxergar.
        </div>
      </div>
      </div>
    </>
  );
}
