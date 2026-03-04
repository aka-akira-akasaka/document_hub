import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * ReactFlow キャンバスを PNG キャプチャし、PDF として保存する。
 * キャプチャ前にエディター専用 UI を非表示にし、完了後に復元する。
 */
export async function exportOrgChartToPdf(
  container: HTMLElement,
  dealName: string,
  fitView: () => void,
): Promise<void> {
  // 1. エディターUI非表示
  container.classList.add("pdf-exporting");

  // 2. fitView でキャンバス全体を表示
  fitView();

  // 3. fitView アニメーション完了を待機
  await new Promise((r) => setTimeout(r, 400));

  try {
    // 4. viewport を PNG にキャプチャ
    const viewport = container.querySelector(
      ".react-flow__viewport"
    ) as HTMLElement;
    if (!viewport) throw new Error("ReactFlow viewport が見つかりません");

    const dataUrl = await toPng(viewport, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    // 5. 画像サイズを取得して PDF 生成
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    const imgW = img.width;
    const imgH = img.height;

    // A4 サイズ (mm): 297 x 210 (横) or 210 x 297 (縦)
    const orientation = imgW >= imgH ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;

    // 画像をページに収まるようにスケール
    const scale = Math.min(availW / imgW, availH / imgH);
    const w = imgW * scale;
    const h = imgH * scale;
    const x = margin + (availW - w) / 2;
    const y = margin + (availH - h) / 2;

    pdf.addImage(dataUrl, "PNG", x, y, w, h);
    pdf.save(`${dealName}_組織図.pdf`);
  } finally {
    // 6. クリーンアップ
    container.classList.remove("pdf-exporting");
  }
}
