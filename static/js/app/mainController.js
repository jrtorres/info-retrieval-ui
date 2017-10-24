/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (app) {
  'use strict';
  app.MainController = function (model) {
    this.model = model;
  };

  //Call Watson Retrieve And Rank API's
  app.MainController.prototype.retrieve_answers_apis = function (query) {
    var self = this;
    var custom_ranker = function () {
      var deferred = new $.Deferred();
      self.model.retrieve_and_rank_custom_ranker(query, deferred); //Watson Retrieve And Rank Custom Ranker API
      return deferred;
    };
    var solr = function () {
      var deferred = new $.Deferred();
      self.model.retrieve_and_rank_solr(query, deferred); //Watson Retrieve And Rank Solr API
      return deferred;
    };

    $.when(custom_ranker(), solr())
      .done(function (resCustomRanker, resSolr) {
        console.log('Main controller : Received rank ('+ resCustomRanker.numFound +') & solr ('+ resSolr.numFound +') hits.');
        if (resCustomRanker.numFound == 0 && resSolr.numFound == 0) {
          console.log('Main controller : No Results');
          $('.loading').fadeOut(500, function () {
            $('#answer_section').show('slow');
            return true;
          });
        }
        showResponseBoxColumns(resCustomRanker, '#box-custom-ranker');
        showResponseBoxColumns(resSolr, '#box-solr');
        $('.loading').fadeOut(500, function () {
          $('#answer_section').show('slow');
        });
      });
  };

  //Show list of boxes to the ui using API response
  function showResponseBoxColumns(response, parentBoxClass) {
    console.log("Number of responses: " + response.docs.length);
    $(response.docs).each(function (i, doc) {
      var box = $('#answer_section').find('#box').clone().removeClass('hide').addClass('box').attr('id', '');
      var rowIndex = i + 1;
      if ($('#row' + rowIndex).length == 0) {
        addRow(rowIndex);
      }
      if (i != 0) {
        $('#row' + rowIndex).addClass('hide');
      }

      $(box).find('.box-text').text(trimAnswer(doc.title));
      $(box).find('.box-text-body').text(trimAnswer(doc.text));//.html(trimAnswer(doc.body));
      //$(box).find('.circle').text(i + 1);

      $(box).find('.full-answer').click({
        doc: doc
      }, fullAnswer);

      if (parentBoxClass === '#box-solr') {
        $(box).find('.watson-icon').attr('src', 'static/images/solr.svg').addClass('solr-icon');
        $(box).find('img').attr('title', 'Solr Search ranker out of the box');
        //$(box).find('.circle').attr('title', 'Rank difference between Ranker and Solr results" should be the text');
      }

      if ($('#row' + rowIndex).find(parentBoxClass).find('.box').length == 0) {
        $('#row' + rowIndex).find(parentBoxClass).append(box);
      }
    });
  }

  function addRow(index) {
    var row = $('#answer_section').find('#row').clone().attr('id', 'row' + index).addClass('row').removeClass('hide');
    $('#results').append(row);
    var fullAns = $('#answer_section').find('#fullAnswer').clone().attr('id', 'fullAnswer' + index).addClass('fullAnswer');
    row.append(fullAns);
  }

  function fullAnswer(event) {
    $('.selected-box').removeClass('selected-box').removeAttr('selected');
    var fullAns = $(this).parent().parent().parent().parent().find('.fullAnswer');
    if ($(this).hasClass('hideAnswer')) {
      $(fullAns).fadeOut(500);
      $(this).text('See full answer');
      $(this).removeClass('hideAnswer');
      return;
    }

    if ($('#results').find('.hideAnswer').length > 0) {
      jQuery($('#results').find('.hideAnswer')[0]).text('See full answer').removeClass('hideAnswer');
      var answerPanes = $('#results').find('.fullAnswer');
      for (var i = 0; i < answerPanes.length; i++) {
        $(answerPanes[i]).fadeOut('slow');
      }
    }
    $(this).parent().parent().addClass('selected-box').attr('selected', true);
    $(this).addClass('hideAnswer').text('Hide answer');

    var d = event.data.doc;
    $(fullAns.find('.result-title')[0]).text(d['title']);
    $(fullAns.find('.result-subtitle')[0]).text(d['text']);
    //$(fullAns.find('.result-url')[0]).text(d['enlyton_doc_id']);

    if ($(this).parent().parent()[0].id == 'box-solr') {
      $(fullAns).find('#this-is-why').addClass('hide');
    } else {
      $(fullAns).find('#this-is-why').removeClass('hide');
    }
    $(fullAns).fadeIn(500);
  }

  function trimAnswer(s) {
    var maxSize = 300;
    if (s.length > maxSize) {
      return s.substr(0, maxSize) + ' ...';
    } else {
      return s;
    }
  }

})(window.app || (window.app = {}));
