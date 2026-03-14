import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey as string;
const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * 音声ファイルをOpenAI Whisper APIで文字起こしする
 * @param audioUri expo-avが生成したローカルファイルURI
 * @returns 文字起こしされたテキスト
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  // FormDataとして送信
  const formData = new FormData();

  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as unknown as Blob);

  formData.append('model', 'whisper-1');
  formData.append('language', 'ja');
  formData.append('response_format', 'text');

  const response = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API エラー: ${response.status} ${error}`);
  }

  const transcription = await response.text();
  return transcription.trim();
}

/**
 * 録音ファイルを削除する（処理完了後に呼び出す）
 */
export async function deleteAudioFile(audioUri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
    }
  } catch {
    // 削除失敗は無視（次回起動時にキャッシュクリアに任せる）
  }
}
