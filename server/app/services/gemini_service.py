from google import genai
from app.config import Config

class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=Config.GEMINI_API_KEY)
    
    def generate_ideas_videos(self, prompt):
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[f"Eres un filmmaker profesional, Genera una idea de video para un video sobre: {prompt}"],
                config=genai.types.GenerateContentConfig(
                    max_output_tokens=400
                )
            )
            
            return {
                'description': response.text,
                'status': 'success'
            }
            
        except Exception as e:
            return {
                'error': 'Error al generar la descripción de la imagen',
                'details': str(e)
            }