from django.shortcuts import render
from django.http import HttpResponse
# we were getting 403 when requesting this view so we're trying to make it csrf exempt
from django.views.decorators.csrf import csrf_exempt
# we also need to import json for json.dumps
import json

def play_game(request):
	return render(request, 'tic_tac_AI/play_game.html', {})

# we're opening our site to attacks by making this view csrf exempt, but it resulted in no 403 error, (200 request ok)
@csrf_exempt
def AI_moves(request):
    if request.method == 'POST':

    	# grab all the ajax/json data from script.js
        received_board = request.POST.get('board[]')
        AI_TOKEN = request.POST.get('AI_TOKEN')
        DEPTH_NOW = request.POST.get('DEPTH_NOW')
        GAME_OVER = request.POST.get('GAME OVER')

       	# initiate a dictionary holding the json response
        response_data = {}

        # plug in AI backend
        ###############################################



        # end of AI backend
        ###############################################

        # set json response's values based on AI backend's values
        response_data['board[]'] = ['X','X','X','X','X','X','X','X','X']
		# assign the game's current state of over/not over
        response_data['GAME_OVER'] = False

        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )
    # in case of an error
    else:
        return HttpResponse(
            json.dumps({"nothing to see": "this isn't happening"}),
            content_type="application/json"
        )