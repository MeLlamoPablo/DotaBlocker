var selectedHeroes = [];
var bkb = {};
var linkens = {};
var blocked_mode = true;
var strings = {};

$(document).ready(function(){
	//Add the language values in strings/en.json
	$.getJSON("data/strings/en.json", function(json){
		strings = json;
		$.each(strings, function(k, v){
			//Add the string to the element with data-string= the string's key, but only if it exists
			if($('[data-string="' + k + '"]').length > 0) $('[data-string="' + k + '"]').html(v);
		});

		//Put the remaining strings
		$('#enemy_team').attr('data-placeholder', strings.str_main_enter_team);
	});

	//Add the app values in app.json
	$.getJSON("data/app.json", function(app){
		$("#app_title").html(app.title);
		$("#app_version").html(app.version);
		$("#app_dota_patch").html(app.dota_patch);
	});

	//Create the chosen selector
	$.getJSON("data/heroes.json", function(heroes){
		//Sort alphabetically
		var heroes_keys = [];
		$.each(heroes, function(k, v){
			heroes_keys[heroes_keys.length] = k;
		});
		heroes_keys = heroes_keys.sort();
		$.each(heroes_keys, function(k, v){
			$('#enemy_team').append('<option value="' + v + '">' + v + '</option>');
		});
		$('#enemy_team').chosen({
			max_selected_options: 5
		});

		//Add the first tooltips to the hero portraits
		$('.hero_portrait').attr('title', strings.str_ui_no_hero);
		$('.hero_portrait').tooltip({placement: 'bottom'});

		//Listen to the selector changes
		$('#enemy_team').on('change', function(event, params){
			//If a hero has been selected, add his image and tooltip, and check his spells.
			if(typeof params.selected != 'undefined'){
				var index = selectedHeroes.length;
				selectedHeroes[index] = params.selected;

				$('#hero_' + index).attr('src', heroes[params.selected]['img_80px']);
				$('#hero_' + index).attr('data-original-title', params.selected);
				$('#hero_' + index).tooltip();

				$.each(heroes[params.selected]['abilities'], function(k, v){
					//BKB
					if(typeof v.bkb != 'undefined'){
						//If v.bkb is undefined (doesn't exist), we don't show the spell at all.
						//Reasons for not being defined can be the spell not affecting the enemy team or being a passive.
						bkb[k] = {
							hero: params.selected,
							img: v.img,
							// Some hero ability names have been modified to be more helpful to the user.
							// i.e: Permanent Immolation ---> Golem's Permanent Immolation
							// But modifying them will render the wiki urls invalid
							// Thus, on those modified abilities we specify the real_name property, so that the URL is
							// always available.
							url_name: ((typeof v.real_name === 'undefined') ? k.replace(" ", "_") : v.real_name.replace(" ", "_")),
							// Sometimes we wan't to specify additional information on partial piercings; that's what notes are for.
							note: ((typeof v.note === 'undefined') ? false : v.note)
						}
						switch(v.bkb){
							case 'blocked':
								bkb[k]['pierces'] = false;
								break;
							case 'not_blocked':
								bkb[k]['pierces'] = true;
								break;
							case 'partially_blocked':
								// We'll assume that partially_blocked also pierces BKB.
								//
								// Ideally, partially_blocked should be replaced in heroes.json with blocked or not_blocked,
								// depending on the details of the partial block. For instance, Kunkka's X Marks the spot is
								// marked as partially blocked on dota2.gamepedia.com, but it only pierces BKB on allies.
								// This information is irrelevant to the user, since he'd be facing Kunkka. Thus, X Marks the
								// Spot is rewritten to be blocked, and not partially_blocked.
								//
								// Though, that job is not completely done yet, so the heroes.json file needs revision.
								bkb[k]['pierces'] = true;
								break;
							default:
								//This shouldn't ever happen
								alert('Error: couldn\'t determine whether or not ' + k + 'pierces BKB.');
						}
					}

					//Linkens
					if(typeof v.linkens != 'undefined'){
						linkens[k] = {
							hero: params.selected,
							img: v.img,
							url_name: ((typeof v.real_name === 'undefined') ? k.replace(" ", "_") : v.real_name.replace(" ", "_")),
							note: ((typeof v.note === 'undefined') ? false : v.note)
						}
						switch(v.linkens){
							case 'blocked':
								linkens[k]['pierces'] = false;
								break;
							case 'not_blocked':
								linkens[k]['pierces'] = true;
								break;
							case 'partially_blocked':
								// Many of the linkens partial blocks are due to the fact that it only blocks if the
								// target hero is the selected target. This is the case of, for example, Oracle's
								// Fortune's End or Shadow Shaman's Ether Shock.
								//
								// This should be common knowledge to the user, and in fact, a message that warns them
								// about it will be displayed.
								//
								// For that reason, partially_blocked abilities will be considered as if they don't
								// pierce linkens.
								linkens[k]['pierces'] = false;
								break;
							default:
								//This shouldn't ever happen
								alert('Error: couldn\'t determine whether or not ' + k + 'pierces linkens.');
						}
					}
				});
			}
			//If a hero has been deselected, remove his image and tooltip
			else if(typeof params.deselected != 'undefined'){
				var index = selectedHeroes.indexOf(params.deselected);
				//If the element is not the last on the array, move the images to the left to "fill the gap".
				if(index !== selectedHeroes.length-1){
					for(var i = index+1; i < selectedHeroes.length; i++){
						$('#hero_' + (i-1)).attr('src', heroes[selectedHeroes[i]]['img_80px']);
					};
					$('#hero_' + (i-1)).attr('src', 'data/images/no_hero.png');
					$('#hero_' + (i-1)).attr('data-original-title', strings.str_ui_no_hero);
					$('#hero_' + (i-1)).tooltip();
				}else{
					$('#hero_' + index).attr('src', 'data/images/no_hero.png');
					$('#hero_' + index).attr('data-original-title', strings.str_ui_no_hero);
					$('#hero_' + index).tooltip();
				}

				selectedHeroes.splice($.inArray(params.deselected, selectedHeroes), 1);

				//Remove their abilities from the bkb var and the linkens var
				$.each(bkb, function(k, v){
					if(v.hero === params.deselected) delete bkb[k];
				});
				$.each(linkens, function(k, v){
					if(v.hero === params.deselected) delete linkens[k];
				});
			}

			//Close the welcome alert and open the warning the first time a hero is selected
			if($('#welcome_alert').attr('style') !== "display: none;"){
				$('#welcome_alert').fadeOut('slow');
				//Only show the warning message if the user hasn't dismissed it
				if(!localStorage.getItem('warning_dismissed')){
					$('#warning').fadeIn('slow');
				}
			}

			//Update the changes
			updateChanges();
		});
	});

	//Misc
		//Add closing animations for alerts
		$(".alert button.close").click(function (e) {
		    $(this).parent().fadeOut('slow');
		    //If the dismished alert is the warning, remember that and don't show it again
		    if($(this).parent().attr('id') === 'warning'){
		    	localStorage.setItem('warning_dismissed', true);
		    }
		});

		//Listen to the switch button
		$("#blocked_mode_switch").click(function(){
			if(blocked_mode){
				blocked_mode = false;

				$("#blocked_mode_switch").removeClass("btn-danger");
				$("#blocked_mode_switch").addClass("btn-success");
				$('[data-string="str_main_blocked_by"]').removeClass("green");
				$('[data-string="str_main_blocked_by"]').addClass("red");

				$('#blocked_mode_switch_text').html(strings.str_ui_switch_to_blocked);

				$('[data-string="str_main_blocked_by"]').html(strings.str_main_piercing);
			}else{
				blocked_mode = true;

				$("#blocked_mode_switch").removeClass("btn-success");
				$("#blocked_mode_switch").addClass("btn-danger");
				$('[data-string="str_main_blocked_by"]').removeClass("red");
				$('[data-string="str_main_blocked_by"]').addClass("green");

				$('#blocked_mode_switch_text').html(strings.str_ui_switch_to_piercing);

				$('[data-string="str_main_blocked_by"]').html(strings.str_main_blocked_by);
			}
			updateChanges();
		});

		//Remove focus from buttons after releasing the mouse
		$(".btn").mouseup(function(){
		    $(this).blur();
		})
});

function updateChanges(){
	//Update BKB
	$('#abilities_bkb').empty();
	$.each(bkb, function(k, v){
		// If we are in blocked mode, show abilities blocked by BKB
		// Otherwise, show abilities that pierce BKB
		if((blocked_mode && v.pierces === false) || (!blocked_mode && v.pierces === true)){
			$('#abilities_bkb').append(`
				<div class="well well-sm row abilitywell">
	                <div class="col-md-3">
                        <img class="spell" src="${v.img}">
                    </div>
                    <div class="col-md-9">
                        <h4>${v.hero + "'s " + k}</h4>
                        <a href="http://dota2.gamepedia.com/${v.hero.replace(" ", "_") + "#" + v.url_name}" target="_blank">
                        	${strings.str_main_check_on_wiki}
                        	<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>
                        </a>
                        ${(v.note) ? `
	                		<p class="note"><b>${strings.str_ui_note}</b>: ${v.note}</p>
                		` : ''}
                    </div>
                </div>
            `);
		}
	});

	//Update linkens
	$('#abilities_linkens').empty();
	$.each(linkens, function(k, v){
		if((blocked_mode && v.pierces === false) || (!blocked_mode && v.pierces === true)){
			$('#abilities_linkens').append(`
				<div class="well well-sm row abilitywell">
	                <div class="col-md-3">
                        <img class="spell" src="${v.img}">
                    </div>
                    <div class="col-md-9">
                        <h4>${v.hero + "'s " + k}</h4>
                        <a href="http://dota2.gamepedia.com/${v.hero.replace(" ", "_") + "#" + v.url_name}" target="_blank">
                        	${strings.str_main_check_on_wiki}
                        	<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>
                        </a>
                        ${(v.note) ? `
	                		<p class="note"><b>${strings.str_ui_note}</b>: ${v.note}</p>
                		` : ''}
                    </div>
                </div>
            `);
		}
	});
}
