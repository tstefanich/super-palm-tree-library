$(document).ready(function(){

	/************************************

	Search In Navigation

	************************************/

    $('.menu-item-16358').click(function(){
        $(this).addClass('expanded');
        $(this).find("input").val("").focus();
    });
    
    $(".menu-item-16358 input").blur(function() {
        $(this).val("");
        $(".menu-item-16358").removeClass("expanded");
    });
 });










    /************************************

    GRID

    ************************************/


    var currentHeighest = 0;



    $(window).load(function(){
      /*==========================================
           Match All Title Heights in a row  
      ===========================================*/
      

      // TITLES
      $('.item').children('.title').each(function(){
          var currentHeight = $(this).outerHeight();
          if(currentHeight > currentHeighest || currentHeighest == undefined){
            currentHeighest = currentHeight;
          }
      });
      $('.item').children('.title').each(function(){
        $(this).css('height',currentHeighest+"px");
      }); 

      // Image BOXES
      $('.item').children('.image').children('img').each(function(){
          var currentHeight = $(this).outerHeight();
          if(currentHeight > currentHeighest || currentHeighest == undefined){
            currentHeighest = currentHeight;
          }
      });
      $('.item').children('.image').each(function(){
        $(this).css('height',currentHeighest+"px");
      }); 

      // BOXES
      currentHeighest = 0;
      $('.item').each(function(){
          var currentHeight = $(this).outerHeight();
          if(currentHeight > currentHeighest || currentHeighest == undefined){
            currentHeighest = currentHeight;
          }
      });
      $('.item').each(function(){
        $(this).css('height',currentHeighest+"px");
      }); 



    });


    
    /// THIS DOES NOT REALLY WORK>>>> BUT NOT IMPORTANT RIGhT NOW
    /// ALthough this code works for windows load just fine
    $(window).resize(function(){
      console.log('test');
            /*==========================================
           Match All Title Heights in a row  
      ===========================================*/
     

      // TITLES
      currentHeighest = 0;
      $('.item').children('.title').each(function(){
         
          var currentHeight = $(this).outerHeight();
          if(currentHeight > currentHeighest || currentHeighest == undefined){
            currentHeighest = currentHeight;
          }
      });
      $('.item').children('.title').each(function(){
        $(this).css('height',currentHeighest+"px");
      }); 

      // Image BOXES
       currentHeighest = 0;
      $('.item').children('.image').children('img').each(function(){
        
          var currentHeight = $(this).height();
          if(currentHeight > currentHeighest || currentHeighest == undefined){
            currentHeighest = currentHeight;
          }
      });
      $('.item').children('.image').each(function(){
        $(this).css('height',currentHeighest+"px");
      }); 

      // BOXES
      currentHeighest = 0;
      $('.item').each(function(){
        
        
          var currentHeight = $(this).height();
          if(currentHeight > currentHeighest || currentHeighest == undefined){
            currentHeighest = currentHeight;
          }
          
      });
       $('.item').each(function(){
            $(this).css('height',currentHeighest+"px");
            console.log('made it');
          }); 
     

    });










    /************************************

    TRASH

    ************************************/








 $(document).ready(function(){
        $('.btn-restore').click(function(){
          var thisButton = $(this);
          var pdf = $(this).attr('data-pdf-file');

          $.ajax({
            type:    "POST",
            contentType: 'application/json',
            processData: false,
            url:     "http://localhost:8080/restore",
            data:    JSON.stringify({"filePath": pdf, "folder": "trash"}),
            complete: function(data) {
                  //alert('call back complete');
            },
            success: function(data) {
                  //alert('call back success');
                  thisButton.closest('.item-content').fadeOut();
            },
            // vvv---- This is the new bit
            error:   function(jqXHR, textStatus, errorThrown) {
                  alert("Error, status = " + textStatus + ", " +
                        "error thrown: " + errorThrown
                  );
            }
          });

        // 

        });
        $('.btn-delete').click(function(){
           var thisButton = $(this);
           var pdf = $(this).attr('data-pdf-file');
           
           $.ajax({
            type:    "POST",
            contentType: 'application/json',
            processData: false,
            url:     "http://localhost:8080/delete",
            data:    JSON.stringify({"filePath": pdf, "folder": "trash"}),
            complete: function(data) {
                  //alert('call back complete');
            },
            success: function(data) {
                  //alert('call back success');
                  thisButton.closest('.item-content').fadeOut();
            },
            // vvv---- This is the new bit
            error:   function(jqXHR, textStatus, errorThrown) {
                  alert("Error, status = " + textStatus + ", " +
                        "error thrown: " + errorThrown
                  );
            }
          });
        });
        // ADD POPUP ARE YOU SURE YOU WANT TO DELETE///           
            
    });
